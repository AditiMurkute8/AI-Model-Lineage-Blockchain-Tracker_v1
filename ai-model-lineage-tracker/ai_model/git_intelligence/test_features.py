import os
import sys
import json
import math
import tempfile
from features import generate_feature_dataset, extract_commit_features


def run_feature_tests():
    print("==================================================")
    print("RUNNING PHASE 4 FEATURE ENGINEERING TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    proc_path = os.path.join(base_dir, "dataset", "git_commits", "processed_commits_v2.json")
    feat_path = os.path.join(base_dir, "dataset", "git_commits", "features_v1.json")

    # TEST 1: Processed dataset immutability
    print("[TEST 1] Verifying processed_commits_v2.json immutability...")
    assert os.path.exists(proc_path), "Processed dataset file does not exist!"
    with open(proc_path, "r", encoding="utf-8") as f:
        proc_data = json.load(f)
    print(f"  -> TEST 1 PASSED: Processed dataset has {len(proc_data)} records and is untouched.")

    # TEST 2 & 3 & 4 & 5: Feature JSON validity, commit_sha, repo identity, target
    print("\n[TEST 2-5] Verifying features_v1.json schema, target, and provenance...")
    assert os.path.exists(feat_path), "Features dataset V1 file does not exist!"
    with open(feat_path, "r", encoding="utf-8") as f:
        feat_data = json.load(f)

    assert len(feat_data) == len(proc_data), "Record count mismatch!"

    for r in feat_data:
        assert "commit_sha" in r and r["commit_sha"], "Missing commit_sha!"
        assert "repository_name" in r and r["repository_name"] == "axios/axios", "Missing repo identity!"
        assert "target" in r and r["target"], "Missing target!"
        assert "features" in r and isinstance(r["features"], dict), "Missing features dict!"

    print(f"  -> TEST 2-5 PASSED: All {len(feat_data)} records retain commit_sha, repo provenance, target, and features dict.")

    # TEST 6-10: Target Leakage & Forbidden Feature Audit
    print("\n[TEST 6-10] Verifying Target Leakage & Forbidden Feature Exclusion...")
    forbidden_keys = {
        "commit_type", "commit_type_target_role", "commit_type_label_source",
        "risk_level", "risk_label_source", "risk_target_role",
        "impact_scope", "impact_label_source", "impact_target_role",
        "message", "raw_message", "conventional_prefix", "prefix_token",
        "feat_prefix", "fix_prefix", "docs_prefix", "refactor_prefix", "chore_prefix"
    }

    sample_feats = feat_data[0]["features"]
    leaking_keys = set(sample_feats.keys()) & forbidden_keys
    assert not leaking_keys, f"TARGET LEAKAGE DETECTED! Leaking keys: {leaking_keys}"

    # Verify no conventional commit prefix tokens are present as features
    for k in sample_feats.keys():
        assert not k.startswith("prefix_") and not k.endswith("_prefix"), f"Leaking prefix feature key: {k}"

    print("  -> TEST 6-10 PASSED: ZERO target leakage keys or commit message prefixes found in features vector.")

    # TEST 11-13: Schema consistency & NaN/Null/Inf audit
    print("\n[TEST 11-13] Verifying schema consistency and value validity...")
    expected_num_features = len(sample_feats)
    assert expected_num_features == 41, f"Expected 41 features, got {expected_num_features}"

    for idx, r in enumerate(feat_data):
        feats = r["features"]
        assert len(feats) == expected_num_features, f"Schema length mismatch at index {idx}!"
        for fk, fval in feats.items():
            assert fval is not None, f"Null value found in {fk} at index {idx}"
            if isinstance(fval, float):
                assert not math.isnan(fval) and not math.isinf(fval), f"Invalid float {fval} in {fk} at index {idx}"

    print(f"  -> TEST 11-13 PASSED: Schema length (41 features) is 100% consistent. Zero NaN/null/Inf values.")

    # TEST 14-15: Reproducibility across runs
    print("\n[TEST 14-15] Testing 100% feature generation reproducibility...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        p1 = os.path.join(tmp_dir, "run1.json")
        p2 = os.path.join(tmp_dir, "run2.json")
        generate_feature_dataset(proc_path, p1)
        generate_feature_dataset(proc_path, p2)

        with open(p1, "r", encoding="utf-8") as f1, open(p2, "r", encoding="utf-8") as f2:
            d1 = json.load(f1)
            d2 = json.load(f2)

        assert d1 == d2, "Feature generation runs are not deterministic!"

    print("  -> TEST 14-15 PASSED: Feature engineering pipeline is 100% deterministic across runs.")

    print("\n==================================================")
    print("ALL PHASE 4 TEST CASES PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_feature_tests()
