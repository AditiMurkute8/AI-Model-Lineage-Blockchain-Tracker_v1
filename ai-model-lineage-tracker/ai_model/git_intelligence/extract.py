import os
import sys
import json
import argparse
from typing import List, Dict, Optional
from pydriller import Repository

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def validate_repository_path(repo_path: str) -> str:
    """
    Validates that repo_path exists and is a valid Git repository directory.
    Raises ValueError if invalid.
    """
    abs_path = os.path.abspath(repo_path)
    if not os.path.exists(abs_path):
        raise ValueError(f"Repository path does not exist: '{abs_path}'")
    if not os.path.isdir(abs_path):
        raise ValueError(f"Repository path is not a directory: '{abs_path}'")

    git_dir = os.path.join(abs_path, ".git")
    if not os.path.exists(git_dir):
        raise ValueError(f"Path is not a valid Git repository (missing .git): '{abs_path}'")

    return abs_path


def extract_commits(
    repo_path: str,
    output_path: str,
    limit: Optional[int] = None,
    include_merges: bool = False
) -> List[Dict]:
    """
    Extracts raw commit history from a local Git repository using PyDriller.

    Merge Commit Policy:
      By default (include_merges=False), merge commits (commit.merge == True) are skipped.
      This ensures extracted records represent atomic developer changes without duplicate branch diffs.

    Output Schema:
      - commit_sha: str
      - message: str
      - author: str
      - timestamp: str (ISO 8601)
      - parent_sha: Optional[str]
      - files_changed: List[str]
      - file_types: List[str]
      - diff: str
      - lines_added: int
      - lines_deleted: int
      - num_files_modified: int
    """
    abs_repo = validate_repository_path(repo_path)
    abs_out = os.path.abspath(output_path)

    out_dir = os.path.dirname(abs_out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    extracted_records = []

    try:
        repo_miner = Repository(abs_repo)
        for commit in repo_miner.traverse_commits():
            # Apply Merge Commit Policy
            if commit.merge and not include_merges:
                continue

            files_changed = []
            file_types_set = set()
            diff_chunks = []
            lines_added = 0
            lines_deleted = 0

            for mod in commit.modified_files:
                file_path = mod.new_path or mod.old_path
                if file_path:
                    files_changed.append(file_path)
                    ext = os.path.splitext(file_path)[1].lower()
                    if ext:
                        file_types_set.add(ext)

                if mod.added_lines is not None:
                    lines_added += mod.added_lines
                if mod.deleted_lines is not None:
                    lines_deleted += mod.deleted_lines

                if mod.diff:
                    old_p = mod.old_path or "/dev/null"
                    new_p = mod.new_path or "/dev/null"
                    diff_chunks.append(f"--- {old_p}\n+++ {new_p}\n{mod.diff}")

            parent_sha = commit.parents[0] if (commit.parents and len(commit.parents) > 0) else None

            record = {
                "commit_sha": commit.hash,
                "message": commit.msg or "",
                "author": commit.author.name if commit.author else "Unknown",
                "timestamp": commit.author_date.isoformat() if commit.author_date else "",
                "parent_sha": parent_sha,
                "files_changed": files_changed,
                "file_types": sorted(list(file_types_set)),
                "diff": "\n\n".join(diff_chunks),
                "lines_added": lines_added,
                "lines_deleted": lines_deleted,
                "num_files_modified": len(files_changed)
            }

            extracted_records.append(record)

    except Exception as e:
        raise RuntimeError(f"Error extracting commits from '{abs_repo}': {e}") from e

    if limit is not None and limit > 0:
        extracted_records = extracted_records[-limit:]

    with open(abs_out, "w", encoding="utf-8") as f:
        json.dump(extracted_records, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(extracted_records)} commits to {abs_out}")
    return extracted_records


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Git commit dataset for AI Model Lineage")
    parser.add_argument("--repo", required=True, help="Path to local Git repository")
    parser.add_argument("--out", required=True, help="Output JSON file path")
    parser.add_argument("--limit", type=int, default=None, help="Limit to most recent N commits")
    parser.add_argument("--include-merges", action="store_true", help="Include merge commits (default: false)")
    args = parser.parse_args()

    try:
        extract_commits(args.repo, args.out, args.limit, args.include_merges)
    except Exception as err:
        print(f"Extraction Error: {err}", file=sys.stderr)
        sys.exit(1)
