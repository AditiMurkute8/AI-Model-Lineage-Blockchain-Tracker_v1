import os
import sys
import re
import json
import urllib.request
import urllib.error
import pandas as pd
import joblib

# ================= PATH CONFIG =================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ================= URL VALIDATION =================
GITHUB_URL_REGEX = re.compile(
    r"^https?://github\.com/([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)/commit/([a-fA-F0-9]{7,40})/?$"
)

def validate_and_parse_url(url):
    if not url or not isinstance(url, str):
        return None, None, None, "GitHub commit URL is required."
    
    url = url.strip()
    match = GITHUB_URL_REGEX.match(url)
    if not match:
        return None, None, None, "Invalid GitHub commit URL format. Expected: https://github.com/OWNER/REPOSITORY/commit/COMMIT_SHA"
    
    owner, repo, commit_sha = match.groups()
    return owner, repo, commit_sha, None

# ================= GITHUB PATCH FALLBACK PARSER =================
def fetch_patch_fallback(owner, repo, commit_sha):
    patch_url = f"https://github.com/{owner}/{repo}/commit/{commit_sha}.patch"
    req = urllib.request.Request(patch_url, headers={
        "User-Agent": "Antigravity-Git-Commit-Intelligence/2.0"
    })
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            patch_text = response.read().decode("utf-8", errors="ignore")
            
        lines = patch_text.splitlines()
        commit_message = "Git commit update"
        author = "Contributor"
        date_str = ""
        
        for idx, line in enumerate(lines[:20]):
            if line.startswith("From:"):
                author = line.replace("From:", "").strip()
            elif line.startswith("Date:"):
                date_str = line.replace("Date:", "").strip()
            elif line.startswith("Subject:"):
                commit_message = line.replace("Subject:", "").replace("[PATCH]", "").strip()

        files_changed = 0
        additions = 0
        deletions = 0
        file_list = []
        current_file_patch = []
        current_filename = None

        for line in lines:
            if line.startswith("diff --git"):
                if current_filename:
                    file_list.append({
                        "filename": current_filename,
                        "status": "modified",
                        "additions": 0,
                        "deletions": 0,
                        "patch": "\n".join(current_file_patch)
                    })
                    current_file_patch = []
                files_changed += 1
                parts = line.split(" ")
                if len(parts) >= 4:
                    current_filename = parts[3].replace("b/", "")
            elif current_filename:
                current_file_patch.append(line)

            if line.startswith("+") and not line.startswith("+++"):
                additions += 1
            elif line.startswith("-") and not line.startswith("---"):
                deletions += 1

        if current_filename:
            file_list.append({
                "filename": current_filename,
                "status": "modified",
                "additions": 0,
                "deletions": 0,
                "patch": "\n".join(current_file_patch)
            })

        if files_changed == 0 and patch_text:
            files_changed = 1

        data = {
            "sha": commit_sha,
            "commit": {
                "message": commit_message,
                "author": {"name": author, "date": date_str}
            },
            "stats": {
                "additions": additions,
                "deletions": deletions,
                "total": additions + deletions
            },
            "files": file_list
        }
        return data, None
    except Exception as e:
        return None, f"Failed to retrieve commit patch: {str(e)}"

# ================= GITHUB API FETCH =================
def fetch_commit_details(owner, repo, commit_sha):
    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}"
    req = urllib.request.Request(api_url, headers={
        "User-Agent": "Antigravity-Git-Commit-Intelligence/2.0",
        "Accept": "application/vnd.github.v3+json"
    })
    
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status != 200:
                return fetch_patch_fallback(owner, repo, commit_sha)
            data = json.loads(response.read().decode("utf-8"))
            return data, None
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, f"Commit {commit_sha[:7]} not found in repository {owner}/{repo}."
        else:
            return fetch_patch_fallback(owner, repo, commit_sha)
    except Exception:
        return fetch_patch_fallback(owner, repo, commit_sha)

# ================= FEATURE EXTRACTION (v1 Legacy) =================
def extract_features(commit_data):
    stats = commit_data.get("stats", {})
    additions = stats.get("additions", 0)
    deletions = stats.get("deletions", 0)
    total_churn = additions + deletions
    
    files = commit_data.get("files", [])
    files_changed = max(len(files), 1)
    
    commit_obj = commit_data.get("commit", {})
    message = commit_obj.get("message", "")
    message_lower = message.lower()
    
    source_files = 0
    test_files = 0
    config_files = 0
    doc_files = 0
    dep_files = 0
    security_files = 0
    db_files = 0

    source_exts = {".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".go", ".rs", ".rb", ".php", ".cs"}
    config_exts = {".json", ".yaml", ".yml", ".toml", ".env", ".babelrc", ".eslintrc", ".dockerfile"}
    doc_exts = {".md", ".txt", ".rst", ".adoc"}
    dep_names = {"package.json", "package-lock.json", "requirements.txt", "cargo.toml", "go.mod", "pom.xml", "build.gradle"}

    for f in files:
        filename = f.get("filename", "").lower()
        ext = os.path.splitext(filename)[1]
        basename = os.path.basename(filename)

        if ext in source_exts and not any(k in filename for k in ["test", "spec"]):
            source_files += 1

        if any(k in filename for k in ["test", "spec", "__tests__"]):
            test_files += 1

        if ext in config_exts or "config" in filename or filename.startswith("."):
            config_files += 1

        if ext in doc_exts or "docs/" in filename or basename in ["readme", "license"]:
            doc_files += 1

        if basename in dep_names or "lock" in basename:
            dep_files += 1

        if any(k in filename for k in ["auth", "jwt", "security", "crypto", "permission", "passport", "oauth", "token", "secret"]):
            security_files += 1

        if any(k in filename for k in ["migration", "schema", "sql", "entity", "model", "prisma", "knex", "database"]):
            db_files += 1

    msg_has_fix = 1 if any(w in message_lower for w in ["fix", "bug", "issue", "resolve", "close", "patch", "error"]) else 0
    msg_has_feat = 1 if any(w in message_lower for w in ["add", "feat", "feature", "implement", "new", "support", "create"]) else 0
    msg_has_refactor = 1 if any(w in message_lower for w in ["refactor", "clean", "simplify", "restructure", "optimize", "rename"]) else 0
    msg_has_docs = 1 if any(w in message_lower for w in ["doc", "readme", "comment", "changelog", "typo"]) else 0

    return {
        "files_changed": files_changed,
        "lines_added": additions,
        "lines_deleted": deletions,
        "total_churn": total_churn,
        "source_files": source_files,
        "test_files": test_files,
        "config_files": config_files,
        "doc_files": doc_files,
        "dep_files": dep_files,
        "security_files": security_files,
        "db_files": db_files,
        "msg_has_fix": msg_has_fix,
        "msg_has_feat": msg_has_feat,
        "msg_has_refactor": msg_has_refactor,
        "msg_has_docs": msg_has_docs
    }

# ================= FEATURE EXTRACTION (v2 22 Pure Structural Features) =================
def extract_features_v2(commit_data):
    stats = commit_data.get("stats", {})
    additions = stats.get("additions", 0)
    deletions = stats.get("deletions", 0)
    total_churn = additions + deletions
    
    files = commit_data.get("files", [])
    files_changed = max(len(files), 1)

    source_files = 0
    test_files = 0
    config_files = 0
    doc_files = 0
    dependency_files = 0
    security_files = 0
    database_files = 0

    dirs_touched_set = set()
    files_added = 0
    files_deleted = 0
    files_modified = 0
    files_renamed = 0
    max_file_churn = 0
    diff_hunk_count = 0

    source_exts = {".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".go", ".rs", ".rb", ".php", ".cs"}
    config_exts = {".json", ".yaml", ".yml", ".toml", ".env", ".babelrc", ".eslintrc", ".dockerfile"}
    doc_exts = {".md", ".txt", ".rst", ".adoc"}
    dep_names = {"package.json", "package-lock.json", "requirements.txt", "cargo.toml", "go.mod", "pom.xml", "build.gradle"}

    for f in files:
        filename = f.get("filename", "").lower()
        ext = os.path.splitext(filename)[1]
        basename = os.path.basename(filename)
        dir_name = os.path.dirname(filename)
        if dir_name:
            dirs_touched_set.add(dir_name)

        status = f.get("status", "modified").lower()
        if status in ["added", "added"]:
            files_added += 1
        elif status in ["removed", "deleted"]:
            files_deleted += 1
        elif status in ["renamed"]:
            files_renamed += 1
        else:
            files_modified += 1

        file_add = f.get("additions", 0)
        file_del = f.get("deletions", 0)
        file_churn = file_add + file_del
        if file_churn > max_file_churn:
            max_file_churn = file_churn

        patch_str = f.get("patch", "")
        if patch_str:
            diff_hunk_count += patch_str.count("@@")

        if ext in source_exts and not any(k in filename for k in ["test", "spec"]):
            source_files += 1
        if any(k in filename for k in ["test", "spec", "__tests__"]):
            test_files += 1
        if ext in config_exts or "config" in filename or filename.startswith("."):
            config_files += 1
        if ext in doc_exts or "docs/" in filename or basename in ["readme", "license"]:
            doc_files += 1
        if basename in dep_names or "lock" in basename:
            dependency_files += 1
        if any(k in filename for k in ["auth", "jwt", "security", "crypto", "permission", "passport", "oauth", "token", "secret"]):
            security_files += 1
        if any(k in filename for k in ["migration", "schema", "sql", "entity", "model", "prisma", "knex", "database"]):
            database_files += 1

    directories_touched = max(len(dirs_touched_set), 1)
    if files_added == 0 and files_deleted == 0 and files_modified == 0 and files_renamed == 0:
        files_modified = files_changed

    addition_deletion_ratio = round((additions + 1) / (deletions + 1), 4)
    average_churn_per_file = round(total_churn / files_changed, 4)
    test_file_ratio = round(test_files / files_changed, 4)
    source_file_ratio = round(source_files / files_changed, 4)

    return {
        "files_changed": files_changed,
        "lines_added": additions,
        "lines_deleted": deletions,
        "total_churn": total_churn,
        "source_files": source_files,
        "test_files": test_files,
        "config_files": config_files,
        "doc_files": doc_files,
        "dependency_files": dependency_files,
        "security_files": security_files,
        "database_files": database_files,
        "directories_touched": directories_touched,
        "files_added": files_added,
        "files_deleted": files_deleted,
        "files_modified": files_modified,
        "files_renamed": files_renamed,
        "addition_deletion_ratio": addition_deletion_ratio,
        "average_churn_per_file": average_churn_per_file,
        "max_file_churn": max_file_churn,
        "test_file_ratio": test_file_ratio,
        "source_file_ratio": source_file_ratio,
        "diff_hunk_count": diff_hunk_count
    }

# ================= RISK & IMPACT ANALYSIS =================
def evaluate_risk_and_impact(features, commit_data):
    files_changed = features.get("files_changed", 1)
    total_churn = features.get("total_churn", 0)
    security_files = features.get("security_files", 0)
    db_files = features.get("database_files", features.get("db_files", 0))
    config_files = features.get("config_files", 0)
    source_files = features.get("source_files", 0)
    test_files = features.get("test_files", 0)
    
    risk_factors = []
    impact_factors = []

    if security_files > 0:
        risk_factors.append(f"Security/Authentication files modified ({security_files} file(s))")
    if db_files > 0:
        risk_factors.append(f"Database schema or migration files modified ({db_files} file(s))")
    if total_churn > 300:
        risk_factors.append(f"High total line churn ({total_churn} lines modified)")
    if config_files > 2:
        risk_factors.append(f"Multiple configuration/CI files modified ({config_files} file(s))")
    if source_files > 0 and test_files == 0:
        risk_factors.append(f"Source code modified ({source_files} file(s)) without test updates")

    if security_files > 0 or db_files > 0 or total_churn > 300 or config_files > 2:
        risk_level = "HIGH"
    elif source_files > 0 or files_changed > 5 or total_churn > 100:
        risk_level = "MEDIUM"
        if not risk_factors:
            risk_factors.append(f"Moderate code changes across {files_changed} file(s)")
    else:
        risk_level = "LOW"
        risk_factors.append("Low risk changes focused on documentation, tests, or minor updates")

    if security_files > 0 or db_files > 0 or files_changed > 8 or total_churn > 250:
        impact_level = "HIGH"
        if security_files > 0:
            impact_factors.append("Security architecture impact")
        if db_files > 0:
            impact_factors.append("Data storage / schema impact")
        if files_changed > 8 or total_churn > 250:
            impact_factors.append(f"Broad repository impact ({files_changed} files, {total_churn} lines churn)")
    elif files_changed >= 3 or total_churn >= 50:
        impact_level = "MEDIUM"
        impact_factors.append(f"Moderate functional impact across {files_changed} file(s)")
    else:
        impact_level = "LOW"
        impact_factors.append(f"Localized impact limited to {files_changed} file(s)")

    return risk_level, risk_factors, impact_level, impact_factors

# ================= MAIN INFERENCE FUNCTION =================
def analyze_commit(commit_url, version_id="v2"):
    owner, repo, commit_sha, err = validate_and_parse_url(commit_url)
    if err:
        return {"error": err}

    commit_data, err = fetch_commit_details(owner, repo, commit_sha)
    if err:
        return {"error": err}

    version_id = version_id.lower() if version_id else "v2"
    if version_id not in ["v1", "v2"]:
        version_id = "v2"

    if version_id == "v1":
        features_dict = extract_features(commit_data)
    else:
        features_dict = extract_features_v2(commit_data)

    model_ver_dir = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", version_id)
    model_path = os.path.join(model_ver_dir, "model.pkl")
    metadata_path = os.path.join(model_ver_dir, "metadata.json")

    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        return {"error": f"Git Commit Intelligence {version_id} model artifact not found."}

    model = joblib.load(model_path)
    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    feature_cols = metadata.get("feature_names", list(features_dict.keys()))
    input_df = pd.DataFrame([features_dict])[feature_cols]

    predicted_type = model.predict(input_df)[0]
    
    confidence = 85.0
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(input_df)[0]
        max_prob = float(max(probs))
        confidence = round(max_prob * 100, 1)

    risk_level, risk_factors, impact_level, impact_factors = evaluate_risk_and_impact(features_dict, commit_data)

    commit_obj = commit_data.get("commit", {})
    author_obj = commit_obj.get("author", {})
    stats = commit_data.get("stats", {})

    result = {
        "repository": f"{owner}/{repo}",
        "commit_sha": commit_sha,
        "short_sha": commit_sha[:7],
        "commit_message": commit_obj.get("message", "").split("\n")[0],
        "author": author_obj.get("name", "Unknown"),
        "timestamp": author_obj.get("date", ""),
        "stats": {
            "files_changed": features_dict["files_changed"],
            "lines_added": stats.get("additions", 0),
            "lines_deleted": stats.get("deletions", 0),
            "total_churn": features_dict["total_churn"]
        },
        "analysis": {
            "commit_type": str(predicted_type),
            "confidence": confidence,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "impact_level": impact_level,
            "impact_factors": impact_factors
        },
        "model_info": {
            "model_id": metadata.get("model_id", "git-commit-intelligence"),
            "version_id": metadata.get("version_id", version_id),
            "model_type": metadata.get("model_type", "Random Forest Classifier"),
            "dataset_name": metadata.get("dataset_name", f"git_commit_dataset_{version_id}.csv"),
            "dataset_hash": metadata.get("dataset_hash", ""),
            "model_hash": metadata.get("model_hash", "")
        }
    }

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "GitHub commit URL argument missing"}))
        sys.exit(1)

    url_arg = sys.argv[1]
    ver_arg = sys.argv[2] if len(sys.argv) >= 3 else "v2"
    analysis_result = analyze_commit(url_arg, ver_arg)
    print(json.dumps(analysis_result, indent=2))
