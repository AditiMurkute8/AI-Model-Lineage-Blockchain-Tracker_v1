import os
import sys
import json
from version_registry import get_model_versions, get_model_version, validate_model_version, resolve_lineage
from lineage import verify_model_lineage
from hashing.hash_utils import generate_file_hash


def run_versioning_phase8_tests():
    print("==================================================")
    print("RUNNING PHASE 8 VERSIONING & PROVENANCE TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")

    # TEST 1: Version Discovery
    print("[TEST 1] Testing dynamic version discovery...")
    versions = get_model_versions("git-commit-intelligence")
    assert len(versions) >= 1
    assert versions[0]["model_id"] == "git-commit-intelligence"
    assert versions[0]["version_id"] == "v1"

    non_existent = get_model_versions("nonexistent_model_id")
    assert len(non_existent) == 0
    print("  -> TEST 1 PASSED: Version discovery returned valid v1 and empty list for non-existent model.")

    # TEST 2: Version Validation Engine
    print("\n[TEST 2] Testing Version Validation Engine...")
    val_v1 = validate_model_version("git-commit-intelligence", "v1")
    assert val_v1["status"] == "VALID"
    assert val_v1["artifact_integrity"] == "VERIFIED"

    val_missing_v = validate_model_version("git-commit-intelligence", "v999")
    assert val_missing_v["status"] == "VERSION_NOT_FOUND"

    val_missing_m = validate_model_version("missing-model", "v1")
    assert val_missing_m["status"] == "MODEL_NOT_FOUND"
    print("  -> TEST 2 PASSED: Validation engine correctly validated v1 and flagged missing model/version.")

    # TEST 3: Canonical Lineage Resolution
    print("\n[TEST 3] Testing canonical lineage resolution...")
    lin_res = resolve_lineage("git-commit-intelligence", "v1")
    assert lin_res["success"] is True
    assert lin_res["status"] == "VALID"
    assert lin_res["model"]["model_id"] == "git-commit-intelligence"
    assert lin_res["dataset"]["sha256"] == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    assert lin_res["artifacts"]["model"] == "VERIFIED"
    assert lin_res["blockchain"]["status"] == "BLOCKCHAIN_RECORD_AVAILABLE"
    assert lin_res["blockchain"]["network"] == "Remix VM (In-Memory EVM)"
    print("  -> TEST 3 PASSED: Lineage resolution returned full provenance tree.")

    # TEST 4: Immutability Protection
    print("\n[TEST 4] Verifying immutability of registered model & dataset artifacts...")
    model_hash = generate_file_hash(os.path.join(model_dir, "model.pkl"))
    scaler_hash = generate_file_hash(os.path.join(model_dir, "scaler.pkl"))
    features_hash = generate_file_hash(os.path.join(base_dir, "dataset", "git_commits", "features_v1.json"))

    manifest_path = os.path.join(model_dir, "model_integrity.json")
    with open(manifest_path, "r", encoding="utf-8") as mf:
        manifest = json.load(mf)

    assert model_hash == manifest["model_hash"]
    assert scaler_hash == manifest["scaler_hash"]
    assert features_hash == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    print("  -> TEST 4 PASSED: Binary SHA-256 hashes of model.pkl, scaler.pkl, and features_v1.json match model_integrity.json 100%.")


    # TEST 5: Legacy Model Protection
    print("\n[TEST 5] Verifying legacy model directory protection...")
    for legacy in ["logistic-regression", "decision-tree", "random-forest", "svm"]:
        legacy_path = os.path.join(base_dir, "ai_model", "model_versions", legacy)
        assert os.path.exists(legacy_path), f"Legacy directory '{legacy}' missing!"
    print("  -> TEST 5 PASSED: All 4 legacy model version directories remain intact.")

    print("\n==================================================")
    print("ALL PHASE 8 VERSIONING TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    run_versioning_phase8_tests()
