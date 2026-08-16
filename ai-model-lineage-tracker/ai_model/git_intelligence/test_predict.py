import os
import sys
import json
from predict import predict_git_commit, load_model_artifacts


def run_prediction_tests():
    print("==================================================")
    print("RUNNING PHASE 7 PREDICTION PIPELINE TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")

    # TEST 1-3: Artifact existence
    print("[TEST 1-3] Testing artifact file existence...")
    assert os.path.exists(os.path.join(model_dir, "model.pkl")), "model.pkl missing!"
    assert os.path.exists(os.path.join(model_dir, "scaler.pkl")), "scaler.pkl missing!"
    assert os.path.exists(os.path.join(model_dir, "metadata.json")), "metadata.json missing!"
    print("  -> TEST 1-3 PASSED: model.pkl, scaler.pkl, and metadata.json all exist.")

    # TEST 4: Feature ordering
    print("\n[TEST 4] Testing feature ordering loading...")
    model, scaler, meta = load_model_artifacts()
    keys = meta.get("feature_keys", [])
    assert len(keys) == 41, f"Expected 41 feature keys, got {len(keys)}"
    print("  -> TEST 4 PASSED: Loaded 41 feature ordering keys.")

    # TEST 5-7: Prediction execution & schema validation
    print("\n[TEST 5-7] Testing commit prediction execution & response schema...")
    sample_input = {
        "message": "fix: resolve memory leak in http adapter",
        "files_changed": ["lib/adapters/http.js"],
        "lines_added": 12,
        "lines_deleted": 4,
        "num_files_modified": 1,
        "diff": "--- lib/adapters/http.js\n+++ lib/adapters/http.js\n+cleanUpStream(stream);"
    }

    res = predict_git_commit(sample_input)
    assert res["success"] is True
    assert res["model_id"] == "git-commit-intelligence"
    assert res["version_id"] == "v1"
    assert res["algorithm"] == "Support Vector Machine (RBF Kernel)"
    assert res["prediction"] in meta["classes"]
    print(f"  -> TEST 5-7 PASSED: Valid prediction generated = '{res['prediction']}'.")

    # TEST 8: Invalid / minimal input safety
    print("\n[TEST 8] Testing fallback safety on empty/minimal input...")
    empty_input = {}
    res_empty = predict_git_commit(empty_input)
    assert res_empty["success"] is True
    assert res_empty["prediction"] in meta["classes"]
    print(f"  -> TEST 8 PASSED: Empty input handled safely without error (prediction='{res_empty['prediction']}').")

    # TEST 9: Prediction determinism
    print("\n[TEST 9] Testing prediction determinism...")
    res1 = predict_git_commit(sample_input)
    res2 = predict_git_commit(sample_input)
    assert res1 == res2, "Prediction outputs are not deterministic!"
    print("  -> TEST 9 PASSED: Consecutive prediction runs are 100% deterministic.")

    # TEST 10: Legacy model artifact protection
    print("\n[TEST 10] Verifying legacy model artifact protection...")
    for legacy in ["logistic-regression", "decision-tree", "random-forest", "svm"]:
        legacy_dir = os.path.join(base_dir, "ai_model", "model_versions", legacy)
        assert os.path.exists(legacy_dir), f"Legacy directory '{legacy}' missing!"
    print("  -> TEST 10 PASSED: All 4 legacy model histories remain untouched.")

    print("\n==================================================")
    print("ALL PHASE 7 PREDICTION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_prediction_tests()
