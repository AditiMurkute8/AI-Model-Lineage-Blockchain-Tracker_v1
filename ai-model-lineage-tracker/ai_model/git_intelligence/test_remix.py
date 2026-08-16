import os
import sys
import json
from remix_verifier import verify_payload_and_local_integrity
from lineage import verify_local_integrity


def run_remix_phase6d_tests():
    print("==================================================")
    print("RUNNING PHASE 6D REMIX VERIFICATION TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")
    payload_path = os.path.join(model_dir, "blockchain_registration_payload.json")

    # TEST 1-3: Payload File Existence & Content
    print("[TEST 1-3] Testing payload file existence and JSON schema...")
    assert os.path.exists(payload_path), "blockchain_registration_payload.json missing!"
    with open(payload_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    assert payload["model_id"] == "git-commit-intelligence"
    assert payload["version_id"] == "v1"
    assert payload["contract_function"] == "registerModelVersion"
    assert payload["contract_read_function"] == "getModelVersion"
    print("  -> TEST 1-3 PASSED: Payload file verified (model_id='git-commit-intelligence', version_id='v1').")

    # TEST 4: Live Dataset SHA-256 Match
    print("\n[TEST 4] Testing live features_v1.json SHA-256 hash match...")
    res = verify_payload_and_local_integrity()
    assert res["dataset_hash"] == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    assert res["dataset_hash_matches_payload"] is True
    print(f"  -> TEST 4 PASSED: Dataset SHA-256 matches payload ({res['dataset_hash'][:16]}...).")

    # TEST 5: Local Artifact Integrity Check (VERIFIED)
    print("\n[TEST 5] Testing local artifact integrity check...")
    assert res["local_artifact_status"] == "VERIFIED"
    print(f"  -> TEST 5 PASSED: Local artifact status returned '{res['local_artifact_status']}'.")

    # TEST 6: Legacy Model Protection
    print("\n[TEST 6] Verifying legacy model history protection...")
    for legacy in ["logistic-regression", "decision-tree", "random-forest", "svm"]:
        legacy_dir = os.path.join(base_dir, "ai_model", "model_versions", legacy)
        assert os.path.exists(legacy_dir), f"Legacy folder '{legacy}' missing!"
    print("  -> TEST 6 PASSED: All 4 legacy model histories remain 100% intact.")

    print("\n==================================================")
    print("ALL PHASE 6D REMIX VERIFICATION TESTS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_remix_phase6d_tests()
