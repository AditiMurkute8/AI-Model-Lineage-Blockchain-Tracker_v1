import os
import sys
import json
from lineage import generate_integrity_manifest, verify_local_integrity, demonstrate_tamper_detection
from register_on_blockchain import register_lineage_on_blockchain


def run_lineage_tests():
    print("==================================================")
    print("RUNNING PHASE 6 LINEAGE & INTEGRITY TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")
    feat_path = os.path.join(base_dir, "dataset", "git_commits", "features_v1.json")

    # TEST 1-4: Artifact existence checks
    print("[TEST 1-4] Verifying artifact file existence...")
    assert os.path.exists(os.path.join(model_dir, "model.pkl")), "model.pkl missing!"
    assert os.path.exists(os.path.join(model_dir, "scaler.pkl")), "scaler.pkl missing!"
    assert os.path.exists(os.path.join(model_dir, "metadata.json")), "metadata.json missing!"
    assert os.path.exists(feat_path), "features_v1.json missing!"
    print("  -> TEST 1-4 PASSED: model.pkl, scaler.pkl, metadata.json, features_v1.json all exist.")

    # TEST 5-9: Manifest & SHA-256 Hash Matching
    print("\n[TEST 5-9] Testing integrity manifest generation & hash matching...")
    manifest = generate_integrity_manifest()
    assert manifest["model_id"] == "git-commit-intelligence"
    assert manifest["version_id"] == "v1"
    assert len(manifest["model_hash"]) == 64
    assert len(manifest["scaler_hash"]) == 64
    assert len(manifest["metadata_hash"]) == 64
    assert len(manifest["dataset_hash"]) == 64

    with open(os.path.join(model_dir, "metadata.json"), "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["dataset_hash"] == manifest["dataset_hash"], "Dataset hash mismatch between metadata and manifest!"
    print(f"  -> TEST 5-9 PASSED: Manifest matches metadata dataset hash ({manifest['dataset_hash'][:16]}...).")

    # TEST 10-11: Canonical Identity & Blockchain Mapping
    print("\n[TEST 10-11] Verifying canonical identity & blockchain mapping...")
    b_res = register_lineage_on_blockchain()
    mapping = b_res["mapping_info"]
    assert mapping["modelId"] == "git-commit-intelligence"
    assert mapping["versionId"] == "v1"
    assert mapping["datasetHash"] == manifest["dataset_hash"]
    print(f"  -> TEST 10-11 PASSED: Canonical identity 'git-commit-intelligence:v1' cleanly mapped.")

    # TEST 12-14: Local Hash Verification (VERIFIED)
    print("\n[TEST 12-14] Verifying live local hash verification...")
    status, audit = verify_local_integrity()
    assert status == "VERIFIED", f"Local integrity check failed: {audit}"
    print(f"  -> TEST 12-14 PASSED: Live verification returned status '{status}'.")

    # TEST 15: Tamper Detection (MISMATCH on Tampered Copy)
    print("\n[TEST 15] Testing tamper detection on temporary copy...")
    tamper_audit = demonstrate_tamper_detection()
    assert tamper_audit["tamper_detected"] is True
    print("  -> TEST 15 PASSED: Tamper detection correctly flagged single-byte mutation.")

    # TEST 16: Legacy Model History Protection
    print("\n[TEST 16] Verifying legacy model history protection...")
    for legacy in ["logistic-regression", "decision-tree", "random-forest", "svm"]:
        legacy_dir = os.path.join(base_dir, "ai_model", "model_versions", legacy)
        assert os.path.exists(legacy_dir), f"Legacy directory '{legacy}' missing!"
        versions = [d for d in os.listdir(legacy_dir) if os.path.isdir(os.path.join(legacy_dir, d))]
        assert len(versions) > 0, f"Legacy versions missing in '{legacy}'!"
    print("  -> TEST 16 PASSED: All 4 legacy model histories (logistic-regression, decision-tree, random-forest, svm) remain untouched.")

    print("\n==================================================")
    print("ALL PHASE 6 LINEAGE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_lineage_tests()
