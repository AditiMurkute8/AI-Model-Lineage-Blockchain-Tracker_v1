import os
import sys
import math
import json
import re
import argparse
from datetime import datetime
from typing import List, Dict, Tuple, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def extract_commit_features(record: Dict) -> Dict[str, Any]:
    """
    Extracts 41 non-leaking ML features from a processed commit record (Mode B: Code/Change Intelligence).
    Excludes commit message text, conventional prefixes, and target metadata.
    """
    files = record.get("files_changed", [])
    file_types = record.get("file_types", [])
    diff = record.get("diff", "")
    lines_added = record.get("lines_added", 0)
    lines_deleted = record.get("lines_deleted", 0)
    num_files = record.get("num_files_modified", 0)

    # 1. Change Size & Ratio Features
    total_lines = lines_added + lines_deleted
    net_lines = lines_added - lines_deleted
    lines_added_ratio = float(lines_added) / float(total_lines) if total_lines > 0 else 0.0
    lines_deleted_ratio = float(lines_deleted) / float(total_lines) if total_lines > 0 else 0.0

    log1p_lines_added = math.log1p(lines_added)
    log1p_lines_deleted = math.log1p(lines_deleted)
    log1p_total_lines = math.log1p(total_lines)
    log1p_files_modified = math.log1p(num_files)

    # 2. File Type Indicators
    ext_set = {ext.lower() for ext in file_types}
    has_js_file = 1 if ".js" in ext_set or any(f.endswith(".js") for f in files) else 0
    has_ts_file = 1 if ".ts" in ext_set or any(f.endswith(".ts") for f in files) else 0
    has_json_file = 1 if ".json" in ext_set or any(f.endswith(".json") for f in files) else 0
    has_md_file = 1 if ".md" in ext_set or any(f.endswith(".md") for f in files) else 0
    has_yml_file = 1 if any(ext in ext_set for ext in [".yml", ".yaml"]) or any(f.endswith((".yml", ".yaml")) for f in files) else 0
    has_test_file = 1 if any(re.search(r"\b(test|spec)\b", f, re.I) for f in files) else 0
    has_config_file = 1 if any(re.search(r"\b(package\.json|tsconfig|webpack|rollup|babel|eslint|\.github)\b", f, re.I) for f in files) else 0

    # 3. Structural File Path & Directory Features
    touches_src = 1 if any(re.search(r"\b(src|lib|dist)\b", f, re.I) for f in files) else 0
    touches_lib = 1 if any(re.search(r"\blib\b", f, re.I) for f in files) else 0
    touches_test = 1 if any(re.search(r"\b(test|spec|__tests__)\b", f, re.I) for f in files) else 0
    touches_docs = 1 if any(re.search(r"\b(docs|.*\.md)\b", f, re.I) for f in files) else 0
    touches_config = 1 if has_config_file else 0
    touches_package_files = 1 if any("package.json" in f or "package-lock" in f for f in files) else 0

    directories = set()
    depths = []
    for f in files:
        parts = f.replace("\\", "/").split("/")
        depths.append(len(parts))
        if len(parts) > 1:
            directories.add("/".join(parts[:-1]))
        else:
            directories.add(".")

    num_directories_touched = len(directories)
    avg_path_depth = float(sum(depths)) / float(len(depths)) if depths else 0.0
    max_path_depth = max(depths) if depths else 0

    # 4. Code-Change Syntax/Structure Features (Parsed from Diff)
    added_lines_text = []
    deleted_lines_text = []
    hunks_count = 0

    for line in diff.split("\n"):
        if line.startswith("@@"):
            hunks_count += 1
        elif line.startswith("+") and not line.startswith("+++"):
            added_lines_text.append(line[1:])
        elif line.startswith("-") and not line.startswith("---"):
            deleted_lines_text.append(line[1:])

    added_text_str = "\n".join(added_lines_text)
    deleted_text_str = "\n".join(deleted_lines_text)

    func_pattern = re.compile(r"\b(function|class|async|await|const\s+\w+\s*=|\b\w+\s*\(.*\)\s*=>)\b")
    import_pattern = re.compile(r"\b(import|require\(|export)\b")
    comment_pattern = re.compile(r"^\s*(//|/\*|\*|#)")
    test_pattern = re.compile(r"\b(expect\(|assert|it\(|describe\(|should)\b")

    added_functions_count = len(func_pattern.findall(added_text_str))
    deleted_functions_count = len(func_pattern.findall(deleted_text_str))

    added_imports_count = len(import_pattern.findall(added_text_str))
    deleted_imports_count = len(import_pattern.findall(deleted_text_str))

    added_comments_count = sum(1 for line in added_lines_text if comment_pattern.match(line))
    deleted_comments_count = sum(1 for line in deleted_lines_text if comment_pattern.match(line))

    added_test_assertions_count = len(test_pattern.findall(added_text_str))

    # 5. Diff Structure Metrics
    diff_length_chars = len(diff)
    diff_num_lines = len(diff.split("\n")) if diff else 0
    diff_hunks_count = hunks_count

    # 6. Commit Metadata Features (Time/Date)
    ts_str = record.get("timestamp", "")
    hour_of_day = 0
    day_of_week = 0
    is_weekend = 0

    if ts_str:
        try:
            # Handle ISO format timestamp
            dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            hour_of_day = dt.hour
            day_of_week = dt.weekday()
            is_weekend = 1 if day_of_week in (5, 6) else 0
        except Exception:
            pass

    features = {
        "lines_added": lines_added,
        "lines_deleted": lines_deleted,
        "total_lines_changed": total_lines,
        "net_line_change": net_lines,
        "lines_added_ratio": round(lines_added_ratio, 4),
        "lines_deleted_ratio": round(lines_deleted_ratio, 4),
        "num_files_modified": num_files,
        "log1p_lines_added": round(log1p_lines_added, 4),
        "log1p_lines_deleted": round(log1p_lines_deleted, 4),
        "log1p_total_lines": round(log1p_total_lines, 4),
        "log1p_files_modified": round(log1p_files_modified, 4),
        "num_distinct_file_types": len(ext_set),
        "has_js_file": has_js_file,
        "has_ts_file": has_ts_file,
        "has_json_file": has_json_file,
        "has_md_file": has_md_file,
        "has_yml_file": has_yml_file,
        "has_test_file": has_test_file,
        "has_config_file": has_config_file,
        "touches_src": touches_src,
        "touches_lib": touches_lib,
        "touches_test": touches_test,
        "touches_docs": touches_docs,
        "touches_config": touches_config,
        "touches_package_files": touches_package_files,
        "num_directories_touched": num_directories_touched,
        "avg_path_depth": round(avg_path_depth, 2),
        "max_path_depth": max_path_depth,
        "added_functions_count": added_functions_count,
        "deleted_functions_count": deleted_functions_count,
        "added_imports_count": added_imports_count,
        "deleted_imports_count": deleted_imports_count,
        "added_comments_count": added_comments_count,
        "deleted_comments_count": deleted_comments_count,
        "added_test_assertions_count": added_test_assertions_count,
        "diff_length_chars": diff_length_chars,
        "diff_num_lines": diff_num_lines,
        "diff_hunks_count": diff_hunks_count,
        "hour_of_day": hour_of_day,
        "day_of_week": day_of_week,
        "is_weekend": is_weekend
    }

    return features


def generate_feature_dataset(
    input_path: str,
    output_path: str
) -> Dict[str, Any]:
    """
    Transforms processed_commits_v2.json into features_v1.json.
    Strictly isolates ML feature vector from targets and analytics.
    """
    abs_in = os.path.abspath(input_path)
    abs_out = os.path.abspath(output_path)

    if not os.path.exists(abs_in):
        raise FileNotFoundError(f"Processed dataset not found at '{abs_in}'")

    with open(abs_in, "r", encoding="utf-8") as f:
        records = json.load(f)

    feature_records = []

    for r in records:
        feats = extract_commit_features(r)

        feature_record = {
            # Provenance
            "repository_name": r.get("repository_name", "axios/axios"),
            "repository_url": r.get("repository_url", "https://github.com/axios/axios"),
            "commit_sha": r.get("commit_sha"),
            "timestamp": r.get("timestamp"),

            # Supervised Target
            "target": r.get("commit_type"),

            # Rule Analytics (Non-ML)
            "analytics_risk_level": r.get("risk_level"),
            "analytics_impact_scope": r.get("impact_scope"),

            # ML Feature Vector Dictionary
            "features": feats
        }

        feature_records.append(feature_record)

    os.makedirs(os.path.dirname(abs_out), exist_ok=True)
    with open(abs_out, "w", encoding="utf-8") as f:
        json.dump(feature_records, f, indent=2, ensure_ascii=False)

    num_features = len(feature_records[0]["features"]) if feature_records else 0
    print(f"Feature Dataset Generation Complete: {len(feature_records)} samples with {num_features} features -> {abs_out}")

    return {
        "record_count": len(feature_records),
        "feature_count": num_features,
        "output_path": abs_out
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Git Commit Intelligence Feature Dataset (Phase 4)")
    parser.add_argument("--in", dest="input_path", required=True, help="Input processed JSON path")
    parser.add_argument("--out", dest="output_path", required=True, help="Output feature JSON path")
    args = parser.parse_args()

    generate_feature_dataset(args.input_path, args.output_path)
