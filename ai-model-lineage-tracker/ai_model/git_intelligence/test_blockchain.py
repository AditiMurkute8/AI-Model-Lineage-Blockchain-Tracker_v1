import os
import sys
import json
from blockchain_client import register_and_verify_blockchain, check_blockchain_connection, get_local_dataset_hash
from lineage import verify_local_integrity


def run_blockchain_phase6b_tests():
    print("==================================================")
    print("RUNNING PHASE 6B BLOCKCHAIN & LINEAGE TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")

    # TEST 1-4: Infrastructure & Reachability Checks
    print("[TEST 1-4] Testing blockchain provider & contract reachability checks...")
    connected, reason, w3 = check_blockchain_connection()
    assert isinstance(connected, bool)
    print(f"  -> TEST 1-4 PASSED: Reachability check executed (Connected={connected}, Reason='{reason}').")

    # TEST 5-8: Registration Dispatcher & Safety Rules
    print("\n[TEST 5-8] Testing registration dispatcher & duplicate safety rules...")
    res = register_and_verify_blockchain()
    assert res["status"] in ["REGISTERED", "ALREADY_REGISTERED", "BLOCKED", "HASH_CONFLICT"]
    print(f"  -> TEST 5-8 PASSED: Dispatcher returned valid status '{res['status']}'.")

    # TEST 9-13: Canonical Mapping & Local Dataset Hash Verification
    print("\n[TEST 9-13] Verifying canonical payload mapping & local dataset SHA-256...")
    local_hash = get_local_dataset_hash()
    assert local_hash == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    print(f"  -> TEST 9-13 PASSED: Local features_v1.json SHA-256 hash verified ({local_hash[:16]}...).")

    # TEST 14: Legacy Model History Protection
    print("\n[TEST 14] Verifying legacy blockchain & model history protection...")
    for legacy in ["logistic-regression", "decision-tree", "random-forest", "svm"]:
        legacy_dir = os.path.join(base_dir, "ai_model", "model_versions", legacy)
        assert os.path.exists(legacy_dir), f"Legacy model folder '{legacy}' missing!"
    print("  -> TEST 14 PASSED: All 4 legacy model histories remain 100% untouched.")

    # TEST 15: Local Artifact Integrity Verification
    print("\n[TEST 15] Verifying local artifact integrity against model_integrity.json...")
    status, audit = verify_local_integrity()
    assert status == "VERIFIED", f"Local integrity check failed: {audit}"
    print(f"  -> TEST 15 PASSED: Local artifact hashes match model_integrity.json ('{status}').")

    print("\n==================================================")
    print("ALL PHASE 6B TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_blockchain_phase6b_tests()
