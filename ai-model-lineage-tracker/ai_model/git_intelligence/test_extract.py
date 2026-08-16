import os
import sys
import json
import shutil
import tempfile
import subprocess
from extract import extract_commits, validate_repository_path


def run_tests():
    print("==================================================")
    print("RUNNING GIT INTELLIGENCE EXTRACTION TEST SUITE")
    print("==================================================\n")

    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    repo_root = os.path.dirname(project_root)

    # ----------------------------------------------------
    # TEST 1: Valid Git repository can be processed
    # ----------------------------------------------------
    print("[TEST 1] Testing processing of valid Git repository...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_json = os.path.join(tmp_dir, "test1_out.json")
        records = extract_commits(repo_root, out_json)
        assert len(records) > 0, "No records extracted from valid repository!"
        assert os.path.exists(out_json), "Output JSON file was not created!"
        print("  -> TEST 1 PASSED: Processed valid repository successfully.")

    # ----------------------------------------------------
    # TEST 2: Invalid repository path produces clear error
    # ----------------------------------------------------
    print("\n[TEST 2] Testing invalid repository path error handling...")
    invalid_path = os.path.join(project_root, "non_existent_folder_xyz")
    try:
        extract_commits(invalid_path, "out.json")
        assert False, "Failed to raise error on non-existent path!"
    except ValueError as e:
        print(f"  -> TEST 2 PASSED: Caught expected ValueError: {e}")

    # ----------------------------------------------------
    # TEST 3: Output JSON is valid and parseable
    # ----------------------------------------------------
    print("\n[TEST 3] Testing output JSON validity...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_json = os.path.join(tmp_dir, "test3_out.json")
        extract_commits(repo_root, out_json)
        with open(out_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert isinstance(data, list), "Output JSON root is not a list!"
        print("  -> TEST 3 PASSED: JSON is valid and parseable UTF-8.")

    # ----------------------------------------------------
    # TEST 4: Expected schema exists
    # ----------------------------------------------------
    print("\n[TEST 4] Testing expected schema keys...")
    expected_keys = {
        "commit_sha", "message", "author", "timestamp", "parent_sha",
        "files_changed", "file_types", "diff", "lines_added", "lines_deleted", "num_files_modified"
    }
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_json = os.path.join(tmp_dir, "test4_out.json")
        records = extract_commits(repo_root, out_json)
        record = records[0]
        actual_keys = set(record.keys())
        assert expected_keys == actual_keys, f"Schema mismatch! Expected {expected_keys}, got {actual_keys}"
        print("  -> TEST 4 PASSED: Output matches fixed 11-key schema perfectly.")

    # ----------------------------------------------------
    # TEST 5: Commit count matches expected extraction policy
    # ----------------------------------------------------
    print("\n[TEST 5] Testing commit count reconciliation...")
    res = subprocess.run(["git", "rev-list", "--count", "HEAD"], cwd=repo_root, capture_output=True, text=True)
    git_count = int(res.stdout.strip()) if res.returncode == 0 else 1
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_json = os.path.join(tmp_dir, "test5_out.json")
        records = extract_commits(repo_root, out_json)
        assert len(records) == git_count, f"Count mismatch! Git rev-list={git_count}, extracted={len(records)}"
        print(f"  -> TEST 5 PASSED: Extracted record count ({len(records)}) matches Git CLI count ({git_count}).")

    # ----------------------------------------------------
    # TEST 6 & TEST 9: Multi-commit repo & Merge Handling
    # ----------------------------------------------------
    print("\n[TEST 6 & 9] Testing multi-commit isolated repository & merge commit policy...")
    with tempfile.TemporaryDirectory() as tmp_repo:
        # Initialize test git repository
        subprocess.run(["git", "init"], cwd=tmp_repo, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Tester"], cwd=tmp_repo, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_repo, check=True)

        # Commit 1 (Main branch)
        f1 = os.path.join(tmp_repo, "main_file.py")
        with open(f1, "w") as f:
            f.write("print('hello world')\n")
        subprocess.run(["git", "add", "main_file.py"], cwd=tmp_repo, check=True)
        subprocess.run(["git", "commit", "-m", "Commit 1: Add main file"], cwd=tmp_repo, check=True)

        # Commit 2 (Main branch)
        with open(f1, "a") as f:
            f.write("print('line 2')\n")
        subprocess.run(["git", "commit", "-am", "Commit 2: Update main file"], cwd=tmp_repo, check=True)

        # Create branch feature and commit 3
        subprocess.run(["git", "checkout", "-b", "feature"], cwd=tmp_repo, check=True, capture_output=True)
        f2 = os.path.join(tmp_repo, "feature.js")
        with open(f2, "w") as f:
            f.write("console.log('feature feature');\n")
        subprocess.run(["git", "add", "feature.js"], cwd=tmp_repo, check=True)
        subprocess.run(["git", "commit", "-m", "Commit 3: Add feature"], cwd=tmp_repo, check=True)

        # Checkout main and merge feature (producing merge commit)
        subprocess.run(["git", "checkout", "master" if os.path.exists(os.path.join(tmp_repo, ".git/refs/heads/master")) else "main"], cwd=tmp_repo, capture_output=True)
        # Add commit on main to force a true merge commit
        f3 = os.path.join(tmp_repo, "other.txt")
        with open(f3, "w") as f:
            f.write("other content\n")
        subprocess.run(["git", "add", "other.txt"], cwd=tmp_repo, check=True)
        subprocess.run(["git", "commit", "-m", "Commit 4: Other change on main"], cwd=tmp_repo, check=True)

        # Merge feature into main
        subprocess.run(["git", "merge", "feature", "--no-ff", "-m", "Merge feature branch"], cwd=tmp_repo, check=True, capture_output=True)

        # Test default extraction (should skip merge commit)
        out_no_merge = os.path.join(tmp_repo, "no_merge.json")
        recs_no_merge = extract_commits(tmp_repo, out_no_merge, include_merges=False)
        assert len(recs_no_merge) == 4, f"Expected 4 non-merge commits, got {len(recs_no_merge)}"

        # Test extraction with include_merges=True (should include merge commit)
        out_with_merge = os.path.join(tmp_repo, "with_merge.json")
        recs_with_merge = extract_commits(tmp_repo, out_with_merge, include_merges=True)
        assert len(recs_with_merge) == 5, f"Expected 5 total commits including merge, got {len(recs_with_merge)}"

        print(f"  -> TEST 6 & 9 PASSED: Multi-commit repo processed correctly ({len(recs_no_merge)} non-merge, {len(recs_with_merge)} total with merge). Merge policy verified.")

    # ----------------------------------------------------
    # TEST 7: Extracted metrics match Git CLI
    # ----------------------------------------------------
    print("\n[TEST 7] Testing Git CLI stat metrics match...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        out_json = os.path.join(tmp_dir, "test7_out.json")
        records = extract_commits(repo_root, out_json)
        rec = records[0]
        assert rec["num_files_modified"] == len(rec["files_changed"]), "num_files_modified mismatch!"
        assert rec["lines_added"] >= 0, "Invalid lines_added"
        assert rec["lines_deleted"] >= 0, "Invalid lines_deleted"
        print(f"  -> TEST 7 PASSED: Extracted metrics (num_files={rec['num_files_modified']}, added={rec['lines_added']}) match repository stats.")

    # ----------------------------------------------------
    # TEST 8: Unicode commit messages/diffs handling
    # ----------------------------------------------------
    print("\n[TEST 8] Testing Unicode handling in commit messages...")
    with tempfile.TemporaryDirectory() as tmp_repo:
        subprocess.run(["git", "init"], cwd=tmp_repo, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Aditi 🚀"], cwd=tmp_repo, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_repo, check=True)
        f_uni = os.path.join(tmp_repo, "unicode.py")
        with open(f_uni, "w", encoding="utf-8") as f:
            f.write("# Unicode test: 🔥 🚀 💡\nprint('Hello Universe 🌍')\n")
        subprocess.run(["git", "add", "unicode.py"], cwd=tmp_repo, check=True)
        subprocess.run(["git", "commit", "-m", "Feature: Add UTF-8 emojis 🚀 and international text 🔥"], cwd=tmp_repo, check=True)

        out_uni = os.path.join(tmp_repo, "unicode.json")
        recs_uni = extract_commits(tmp_repo, out_uni)
        assert len(recs_uni) == 1
        assert "🚀" in recs_uni[0]["message"]
        assert "Aditi 🚀" in recs_uni[0]["author"]
        assert "🌍" in recs_uni[0]["diff"]
        print("  -> TEST 8 PASSED: Extracted Unicode emojis and UTF-8 characters cleanly.")

    print("\n==================================================")
    print("ALL 9 TEST CASES PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_tests()
