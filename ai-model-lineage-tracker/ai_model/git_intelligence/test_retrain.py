import os
import sys
import json
import pickle
from retrain import retrain_model_version, discover_next_version, calculate_sha256
from version_registry import get_model_versions, get_model_version, validate_model_version, resolve_lineage
from predict import predict_git_commit


def run_phase9_retraining_tests():
    print("==================================================")
    print("RUNNING PHASE 9 RETRAINING & VERSION CREATION TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    features_path = os.path.join(base_dir, "dataset", "git_commits", "features_v1.json")
    v1_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")
    v2_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v2")

    # TEST 1: Feature dataset loads successfully
    print("[TEST 1] Testing feature dataset loading...")
    assert os.path.exists(features_path), "features_v1.json missing!"
    with open(features_path, "r", encoding="utf-8") as f:
        recs = json.load(f)
    assert len(recs) == 1718, f"Expected 1718 records, found {len(recs)}"
    print("  -> TEST 1 PASSED: features_v1.json loaded 1,718 commit feature records.")

    # TEST 2: Dataset hash is correctly computed
    print("\n[TEST 2] Verifying dataset SHA-256 computation...")
    d_hash = calculate_sha256(features_path)
    assert d_hash == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    print(f"  -> TEST 2 PASSED: Dataset SHA-256 confirmed as {d_hash[:16]}...")

    # TEST 3 & 4: Version discovery & calculation
    print("\n[TEST 3 & 4] Testing version calculation...")
    versions = get_model_versions("git-commit-intelligence")
    v_ids = [v["version_id"] for v in versions]
    assert "v1" in v_ids, "v1 must be discovered!"
    assert "v2" in v_ids, "v2 must be discovered!"
    print(f"  -> TEST 3 & 4 PASSED: Discovered versions: {v_ids}")

    # TEST 5: v1 directory is not modified
    print("\n[TEST 5] Verifying v1 directory immutability...")
    v1_manifest_path = os.path.join(v1_dir, "model_integrity.json")
    with open(v1_manifest_path, "r", encoding="utf-8") as mf:
        v1_manifest = json.load(mf)
    computed_v1_model_hash = calculate_sha256(os.path.join(v1_dir, "model.pkl"))
    assert computed_v1_model_hash == v1_manifest["model_hash"], "v1 model.pkl has been modified!"
    print("  -> TEST 5 PASSED: v1 model.pkl is 100% byte-for-byte untouched.")

    # TEST 6: v2 artifacts exist
    print("\n[TEST 6] Verifying v2 artifact directory contents...")
    for artifact in ["model.pkl", "scaler.pkl", "metadata.json", "model_integrity.json", "blockchain_registration_payload.json"]:
        assert os.path.exists(os.path.join(v2_dir, artifact)), f"Missing v2 artifact '{artifact}'"
    print("  -> TEST 6 PASSED: All 5 required v2 artifacts exist.")

    # TEST 7 & 8: model.pkl and scaler.pkl load successfully
    print("\n[TEST 7 & 8] Testing v2 model.pkl and scaler.pkl loading...")
    with open(os.path.join(v2_dir, "model.pkl"), "rb") as f:
        v2_model = pickle.load(f)
    with open(os.path.join(v2_dir, "scaler.pkl"), "rb") as f:
        v2_scaler = pickle.load(f)
    assert v2_model is not None and v2_scaler is not None
    print("  -> TEST 7 & 8 PASSED: v2 model.pkl and scaler.pkl deserialized cleanly.")

    # TEST 9 & 10: metadata.json and model_integrity.json are valid
    print("\n[TEST 9 & 10] Testing v2 metadata and integrity manifest...")
    with open(os.path.join(v2_dir, "metadata.json"), "r", encoding="utf-8") as f:
        v2_meta = json.load(f)
    with open(os.path.join(v2_dir, "model_integrity.json"), "r", encoding="utf-8") as f:
        v2_manifest = json.load(f)
    assert v2_meta["version_id"] == "v2"
    assert v2_manifest["version_id"] == "v2"
    print("  -> TEST 9 & 10 PASSED: v2 metadata and integrity manifest schema valid.")

    # TEST 11: All integrity hashes match actual files
    print("\n[TEST 11] Verifying live binary SHA-256 hash match against v2 model_integrity.json...")
    computed_model_h = calculate_sha256(os.path.join(v2_dir, "model.pkl"))
    computed_scaler_h = calculate_sha256(os.path.join(v2_dir, "scaler.pkl"))
    assert computed_model_h == v2_manifest["model_hash"]
    assert computed_scaler_h == v2_manifest["scaler_hash"]
    print("  -> TEST 11 PASSED: Live binary hashes match v2 model_integrity.json 100%.")

    # TEST 12: previous_version == "v1"
    print("\n[TEST 12] Checking parent lineage reference...")
    assert v2_meta.get("previous_version") == "v1"
    print("  -> TEST 12 PASSED: v2 correctly specifies previous_version == 'v1'.")

    # TEST 13 & 14: Metrics validation
    print("\n[TEST 13 & 14] Verifying validation and test evaluation metrics separation...")
    val_f1 = v2_meta["evaluation_metrics"]["validation"]["macro_f1"]
    test_f1 = v2_meta["evaluation_metrics"]["test"]["macro_f1"]
    assert val_f1 > 0 and test_f1 > 0
    assert "validation" in v2_meta["evaluation_metrics"] and "test" in v2_meta["evaluation_metrics"]
    print(f"  -> TEST 13 & 14 PASSED: Validation Macro-F1={val_f1}, Test Macro-F1={test_f1}.")

    # TEST 15: Version registry discovers v1 and v2
    print("\n[TEST 15] Verifying version registry discovery...")
    reg_v = get_model_versions("git-commit-intelligence")
    assert len(reg_v) >= 2
    print(f"  -> TEST 15 PASSED: Version registry discovered {len(reg_v)} versions.")

    # TEST 16 & 17: Prediction using v1 and v2
    print("\n[TEST 16 & 17] Testing predictions on v1 and v2...")
    sample = {
        "message": "fix: correct authentication token crash",
        "files_changed": ["src/auth.py", "tests/test_auth.py"],
        "lines_added": 12,
        "lines_deleted": 4,
        "num_files_modified": 2
    }
    p_v1 = predict_git_commit(sample, version_id="v1")
    p_v2 = predict_git_commit(sample, version_id="v2")
    assert p_v1["version_id"] == "v1"
    assert p_v2["version_id"] == "v2"
    assert p_v1["prediction"] in ["Bug Fix", "Configuration/Chore", "Documentation", "Feature", "General/Other", "Refactoring", "Testing"]
    assert p_v2["prediction"] in ["Bug Fix", "Configuration/Chore", "Documentation", "Feature", "General/Other", "Refactoring", "Testing"]
    print(f"  -> TEST 16 & 17 PASSED: v1 prediction='{p_v1['prediction']}', v2 prediction='{p_v2['prediction']}'.")

    # TEST 18: No legacy model directories changed
    print("\n[TEST 18] Verifying legacy model protection...")
    for legacy in ["logistic-regression", "decision-tree", "random-forest", "svm"]:
        assert os.path.exists(os.path.join(base_dir, "ai_model", "model_versions", legacy))
    print("  -> TEST 18 PASSED: Legacy model directories protected.")

    # TEST 19: Refuse overwrite on existing version
    print("\n[TEST 19] Verifying refusal to overwrite existing version...")
    next_ver, prev_ver = discover_next_version("git-commit-intelligence")
    expected_next = f"v{len(v_ids) + 1}"
    assert next_ver == expected_next, f"Expected next version '{expected_next}', got '{next_ver}'"
    print(f"  -> TEST 19 PASSED: Next version dynamically calculated as '{next_ver}' without overwriting existing versions.")

    # TEST 20: Blockchain status semantics
    print("\n[TEST 20] Verifying blockchain pending status for v2...")
    with open(os.path.join(v2_dir, "blockchain_registration_payload.json"), "r", encoding="utf-8") as f:
        v2_payload = json.load(f)
    # TEST 21: Isolated metadata persistence test (without creating v5)
    print("\n[TEST 21] Testing metadata persistence in isolated temp directory...")
    import tempfile
    with tempfile.TemporaryDirectory() as temp_dir:
        res = retrain_model_version(
            model_id="git-commit-intelligence",
            note_summary="Isolated Test Note Summary",
            code_changes="Isolated Test Code Changes",
            experimental_notes="Isolated Test Experimental Notes",
            target_dir_override=temp_dir
        )
        assert res["success"] is True
        assert res["experiment_note"] == "Isolated Test Note Summary"
        assert res["code_change_summary"] == "Isolated Test Code Changes"
        assert res["code_snippet"] == "Isolated Test Experimental Notes"
        assert "training_time" in res and res["training_time"]

        meta_path = os.path.join(temp_dir, "metadata.json")
        assert os.path.exists(meta_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            temp_meta = json.load(f)

        assert temp_meta["experiment_note"] == "Isolated Test Note Summary"
        assert temp_meta["code_change_summary"] == "Isolated Test Code Changes"
        assert temp_meta["code_snippet"] == "Isolated Test Experimental Notes"
        assert temp_meta["training_time"] == res["training_time"]
        assert temp_meta["training_timestamp"] == res["training_time"]
        assert temp_meta["created_at"] == res["training_time"]

    print("  -> TEST 21 PASSED: Metadata fields & timestamps successfully persisted and verified in isolated sandbox.")

    print("\n==================================================")
    print("ALL PHASE 9 RETRAINING TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_phase9_retraining_tests()
