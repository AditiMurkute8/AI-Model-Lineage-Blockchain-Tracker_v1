import os
import json
import re
import argparse
from typing import List, Dict, Tuple, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Regex patterns for conventional commits
CONVENTIONAL_PATTERNS = [
    (r"^(feat|feature)\b", "Feature"),
    (r"^(fix|bugfix|fixup)\b", "Bug Fix"),
    (r"^(refactor|clean|cleanup)\b", "Refactoring"),
    (r"^(docs|doc)\b", "Documentation"),
    (r"^(test|tests|spec|specs)\b", "Testing"),
    (r"^(perf|performance)\b", "Configuration/Chore"),
    (r"^(sec|security)\b", "Configuration/Chore"),
    (r"^(build|ci|deps|chore)\b", "Configuration/Chore"),
]

# Bot / Release commit patterns
BOT_RELEASE_PATTERNS = [
    r"dependabot",
    r"renovate",
    r"github-actions",
    r"\[bot\]",
    r"^v?\d+\.\d+\.\d+",
    r"^release:",
    r"^chore\(release\):",
    r"bump version",
]


def classify_commit_type(message: str) -> Tuple[str, str]:
    """
    Classifies commit type based on conventional commit prefix or keyword heuristics.
    Returns (commit_type, label_source).
    Taxonomy: Feature, Bug Fix, Documentation, Configuration/Chore, Testing, Refactoring, General/Other.
    Micro-classes (Security, Performance) are consolidated into Configuration/Chore for ML stability.
    """
    msg_clean = message.strip()
    msg_lower = msg_clean.lower()

    # 1. Check conventional commit prefix
    for pattern, label in CONVENTIONAL_PATTERNS:
        if re.search(pattern, msg_lower):
            return label, "conventional_commit_prefix"

    # 2. Keyword fallback checks
    if any(k in msg_lower for k in ["add ", "added", "implement", "new feature", "introduce"]):
        return "Feature", "keyword_heuristic"
    if any(k in msg_lower for k in ["fix", "bug", "issue", "resolve", "patched", "error", "crash"]):
        return "Bug Fix", "keyword_heuristic"
    if any(k in msg_lower for k in ["refactor", "cleanup", "rewrite", "simplify", "restructure"]):
        return "Refactoring", "keyword_heuristic"
    if any(k in msg_lower for k in ["doc", "readme", "comment", "changelog"]):
        return "Documentation", "keyword_heuristic"
    if any(k in msg_lower for k in ["test", "unittest", "coverage"]):
        return "Testing", "keyword_heuristic"
    if any(k in msg_lower for k in ["bump", "upgrade", "deps", "dependency", "package.json"]):
        return "Configuration/Chore", "keyword_heuristic"

    return "General/Other", "default_fallback"


def derive_risk_level(record: Dict) -> Tuple[str, str]:
    """
    Derives risk level as a RULE-BASED ANALYTICS metric (not an ML target).
    Returns (risk_level, risk_label_source).
    """
    lines_changed = record.get("lines_added", 0) + record.get("lines_deleted", 0)
    files_count = record.get("num_files_modified", 0)
    msg_lower = record.get("message", "").lower()

    is_security_core = any(k in msg_lower for k in ["security", "cve", "auth", "vulnerability", "breaking change"])

    if lines_changed > 500 or files_count > 15 or is_security_core:
        return "High", "derived_complexity_heuristic"
    elif lines_changed > 100 or files_count > 5:
        return "Medium", "derived_complexity_heuristic"
    else:
        return "Low", "derived_complexity_heuristic"


def derive_impact_scope(record: Dict) -> Tuple[str, str]:
    """
    Derives impact scope as a RULE-BASED ANALYTICS metric (not an ML target).
    Returns (impact_scope, impact_label_source).
    """
    files = record.get("files_changed", [])
    msg_lower = record.get("message", "").lower()

    if not files:
        return "Utility/Helper", "filepath_scope_heuristic"

    has_core = any(re.search(r"\b(lib|src/core|index\.js|axios\.js)\b", f, re.I) for f in files)
    has_test = any(re.search(r"\b(test|spec|__tests__)\b", f, re.I) for f in files)
    has_docs = any(re.search(r"\b(docs|.*\.md)\b", f, re.I) for f in files)
    has_build = any(re.search(r"\b(package\.json|webpack|rollup|gulpfile|\.github)\b", f, re.I) for f in files)

    if has_core or "core" in msg_lower:
        return "Core API", "filepath_scope_heuristic"
    elif has_build or "build" in msg_lower:
        return "Build/Infrastructure", "filepath_scope_heuristic"
    elif has_test:
        return "Testing", "filepath_scope_heuristic"
    elif has_docs:
        return "Documentation", "filepath_scope_heuristic"
    else:
        return "Utility/Helper", "filepath_scope_heuristic"


def preprocess_dataset(
    input_path: str,
    output_path: str,
    repo_name: str = "axios/axios",
    repo_url: str = "https://github.com/axios/axios"
) -> Dict:
    """
    Preprocesses raw commit JSON into processed_commits_v2.json:
    - Filters bot/release commits, empty commits, lockfile-only commits, and extreme diff outliers.
    - Explicitly separates PRIMARY_ML_TARGET (commit_type) from RULE_BASED_ANALYTICS (risk_level, impact_scope).
    - Preserves full provenance (repository_name, repository_url, commit_sha, timestamp).
    """
    abs_in = os.path.abspath(input_path)
    abs_out = os.path.abspath(output_path)

    if not os.path.exists(abs_in):
        raise FileNotFoundError(f"Input raw dataset not found at '{abs_in}'")

    with open(abs_in, "r", encoding="utf-8") as f:
        raw_records = json.load(f)

    accepted_records = []
    rejected_records = []
    seen_shas = set()

    rejection_counts = {
        "no_files_changed": 0,
        "empty_message": 0,
        "bot_or_release": 0,
        "lockfile_only": 0,
        "extreme_outlier": 0,
        "duplicate_sha": 0
    }

    for rec in raw_records:
        sha = rec.get("commit_sha")
        msg = rec.get("message", "").strip()
        files = rec.get("files_changed", [])
        num_files = rec.get("num_files_modified", 0)
        lines_added = rec.get("lines_added", 0)

        if sha in seen_shas:
            rejection_counts["duplicate_sha"] += 1
            rejected_records.append({**rec, "filter_reason": "duplicate_sha"})
            continue
        seen_shas.add(sha)

        if num_files == 0:
            rejection_counts["no_files_changed"] += 1
            rejected_records.append({**rec, "filter_reason": "no_files_changed"})
            continue

        if not msg:
            rejection_counts["empty_message"] += 1
            rejected_records.append({**rec, "filter_reason": "empty_message"})
            continue

        author = rec.get("author", "").lower()
        msg_lower = msg.lower()
        if any(re.search(p, author, re.I) or re.search(p, msg_lower, re.I) for p in BOT_RELEASE_PATTERNS):
            rejection_counts["bot_or_release"] += 1
            rejected_records.append({**rec, "filter_reason": "bot_or_release"})
            continue

        if files and all(f.lower().endswith(("package-lock.json", "yarn.lock", "pnpm-lock.yaml")) for f in files):
            rejection_counts["lockfile_only"] += 1
            rejected_records.append({**rec, "filter_reason": "lockfile_only"})
            continue

        if lines_added > 50000 or num_files > 200:
            rejection_counts["extreme_outlier"] += 1
            rejected_records.append({**rec, "filter_reason": "extreme_outlier"})
            continue

        # Target 1: Primary ML Classification Target
        commit_type, type_source = classify_commit_type(msg)

        # Target 2 & 3: Derived Rule-Based Analytics (Non-ML targets to prevent leakage)
        risk_level, risk_source = derive_risk_level(rec)
        impact_scope, impact_source = derive_impact_scope(rec)

        processed_record = {
            "repository_name": repo_name,
            "repository_url": repo_url,
            "commit_sha": sha,
            "message": rec.get("message"),
            "author": rec.get("author"),
            "timestamp": rec.get("timestamp"),
            "parent_sha": rec.get("parent_sha"),
            "files_changed": files,
            "file_types": rec.get("file_types", []),
            "diff": rec.get("diff", ""),
            "lines_added": lines_added,
            "lines_deleted": rec.get("lines_deleted", 0),
            "num_files_modified": num_files,

            # PRIMARY ML TARGET
            "commit_type": commit_type,
            "commit_type_label_source": type_source,
            "commit_type_target_role": "PRIMARY_ML_TARGET",

            # RULE-BASED ANALYTICS (Non-ML Target)
            "risk_level": risk_level,
            "risk_label_source": risk_source,
            "risk_target_role": "RULE_BASED_ANALYTICS",

            "impact_scope": impact_scope,
            "impact_label_source": impact_source,
            "impact_target_role": "RULE_BASED_ANALYTICS"
        }

        accepted_records.append(processed_record)

    os.makedirs(os.path.dirname(abs_out), exist_ok=True)
    with open(abs_out, "w", encoding="utf-8") as f:
        json.dump(accepted_records, f, indent=2, ensure_ascii=False)

    audit_report = {
        "raw_total": len(raw_records),
        "accepted_total": len(accepted_records),
        "rejected_total": len(rejected_records),
        "rejection_breakdown": rejection_counts
    }

    print(f"Phase 3B Preprocessing Complete: {len(accepted_records)} accepted / {len(rejected_records)} rejected -> {abs_out}")
    return audit_report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess raw Git commit dataset for AI Model Lineage (Phase 3B)")
    parser.add_argument("--in", dest="input_path", required=True, help="Input raw JSON dataset path")
    parser.add_argument("--out", dest="output_path", required=True, help="Output processed JSON dataset path")
    parser.add_argument("--repo-name", default="axios/axios", help="Repository name")
    parser.add_argument("--repo-url", default="https://github.com/axios/axios", help="Repository URL")
    args = parser.parse_args()

    preprocess_dataset(args.input_path, args.output_path, args.repo_name, args.repo_url)
