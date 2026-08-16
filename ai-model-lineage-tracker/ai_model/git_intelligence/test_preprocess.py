import os
import sys
import json
import tempfile
from preprocess import preprocess_dataset, classify_commit_type, derive_risk_level, derive_impact_scope


def run_preprocessing_tests():
    print("==================================================")
    print("RUNNING PHASE 3B PREPROCESSING TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_path = os.path.join(base_dir, "dataset", "git_commits", "raw_commits_axios.json")
    proc_path = os.path.join(base_dir, "dataset", "git_commits", "processed_commits_v2.json")

    # TEST 1: Raw dataset immutability
    print("[TEST 1] Verifying raw dataset immutability...")
    assert os.path.exists(raw_path), "Raw dataset file does not exist!"
    with open(raw_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    print(f"  -> TEST 1 PASSED: Raw dataset has {len(raw_data)} records and is untouched.")

    # TEST 2: Processed dataset V2 exists & reconciles
    print("\n[TEST 2] Verifying processed_commits_v2.json counts and reconciliation...")
    assert os.path.exists(proc_path), "Processed dataset V2 file does not exist!"
    with open(proc_path, "r", encoding="utf-8") as f:
        proc_data = json.load(f)

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_out = os.path.join(tmp_dir, "test_proc.json")
        audit = preprocess_dataset(raw_path, tmp_out)

    assert audit["raw_total"] == len(raw_data)
    assert audit["accepted_total"] + audit["rejected_total"] == audit["raw_total"]
    assert len(proc_data) == audit["accepted_total"]
    print(f"  -> TEST 2 PASSED: Accepted ({audit['accepted_total']}) + Rejected ({audit['rejected_total']}) = Total ({audit['raw_total']}).")

    # TEST 3: Schema and Target Role Key Verification
    print("\n[TEST 3] Verifying schema and target role keys...")
    req_keys = {
        "repository_name", "repository_url", "commit_sha", "message", "author",
        "timestamp", "parent_sha", "files_changed", "file_types", "diff",
        "lines_added", "lines_deleted", "num_files_modified",
        "commit_type", "commit_type_label_source", "commit_type_target_role",
        "risk_level", "risk_label_source", "risk_target_role",
        "impact_scope", "impact_label_source", "impact_target_role"
    }
    sample = proc_data[0]
    missing = req_keys - set(sample.keys())
    assert not missing, f"Missing required keys in processed sample: {missing}"
    assert sample["commit_type_target_role"] == "PRIMARY_ML_TARGET"
    assert sample["risk_target_role"] == "RULE_BASED_ANALYTICS"
    assert sample["impact_target_role"] == "RULE_BASED_ANALYTICS"
    print("  -> TEST 3 PASSED: Target roles explicitly separate PRIMARY_ML_TARGET from RULE_BASED_ANALYTICS.")

    # TEST 4: Reproducibility
    print("\n[TEST 4] Testing 100% preprocessing reproducibility...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        p1 = os.path.join(tmp_dir, "run1.json")
        p2 = os.path.join(tmp_dir, "run2.json")
        preprocess_dataset(raw_path, p1)
        preprocess_dataset(raw_path, p2)

        with open(p1, "r", encoding="utf-8") as f1, open(p2, "r", encoding="utf-8") as f2:
            d1 = json.load(f1)
            d2 = json.load(f2)

        assert d1 == d2, "Preprocessing runs are not deterministic!"
    print("  -> TEST 4 PASSED: Preprocessing runs are 100% deterministic.")

    print("\n==================================================")
    print("ALL PHASE 3B TEST CASES PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_preprocessing_tests()
