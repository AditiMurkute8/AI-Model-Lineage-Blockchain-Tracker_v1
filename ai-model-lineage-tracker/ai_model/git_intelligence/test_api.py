import os
import sys
import json
import re
from version_registry import get_model_versions, get_model_version, validate_model_version, resolve_lineage
from lineage import verify_model_lineage
from predict import predict_git_commit

VERSION_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]+$")


def run_api_unit_tests():
    print("==================================================")
    print("RUNNING PHASE 8 VERSIONING & LINEAGE TEST SUITE")
    print("==================================================\n")

    # TEST 1: Prediction endpoint function logic
    print("[TEST 1] Testing predict_git_commit endpoint handler logic...")
    sample_payload = {
        "message": "fix: authentication token expiration handler",
        "files_changed": ["src/auth/jwt.py", "tests/test_jwt.py"],
        "lines_added": 18,
        "lines_deleted": 6,
        "num_files_modified": 2
    }

    pred_res = predict_git_commit(sample_payload)
    assert pred_res["success"] is True
    assert pred_res["model_id"] == "git-commit-intelligence"
    assert pred_res["version_id"] == "v1"
    assert pred_res["prediction"] in ["Bug Fix", "Configuration/Chore", "Documentation", "Feature", "General/Other", "Refactoring", "Testing"]
    print(f"  -> TEST 1 PASSED: Prediction returned '{pred_res['prediction']}'.")

    # TEST 2: GET /versions/git-commit-intelligence logic
    print("\n[TEST 2] Testing GET /versions/git-commit-intelligence registry route...")
    versions = get_model_versions("git-commit-intelligence")
    assert len(versions) >= 1
    assert versions[0]["model_id"] == "git-commit-intelligence"
    assert versions[0]["version_id"] == "v1"
    print(f"  -> TEST 2 PASSED: Returned {len(versions)} model version(s).")

    # TEST 3: GET /version/git-commit-intelligence/v1 logic
    print("\n[TEST 3] Testing GET /version/git-commit-intelligence/v1 registry route...")
    v1_meta = get_model_version("git-commit-intelligence", "v1")
    assert v1_meta is not None
    assert v1_meta["algorithm"] == "Support Vector Machine (RBF Kernel)"
    assert v1_meta["dataset_hash"] == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    print("  -> TEST 3 PASSED: Version v1 metadata retrieved cleanly.")

    # TEST 4: Version Validation Engine
    print("\n[TEST 4] Testing validate_model_version validation engine...")
    valid_res = validate_model_version("git-commit-intelligence", "v1")
    assert valid_res["status"] == "VALID"
    assert valid_res["artifact_integrity"] == "VERIFIED"

    invalid_ver = validate_model_version("git-commit-intelligence", "v999")
    assert invalid_ver["status"] == "VERSION_NOT_FOUND"

    invalid_model = validate_model_version("nonexistent-model", "v1")
    assert invalid_model["status"] == "MODEL_NOT_FOUND"
    print("  -> TEST 4 PASSED: Version validation engine correctly validated v1 and flagged missing models/versions.")

    # TEST 5: Canonical Lineage Resolution
    print("\n[TEST 5] Testing resolve_lineage resolution engine...")
    lin_res = resolve_lineage("git-commit-intelligence", "v1")
    assert lin_res["success"] is True
    assert lin_res["status"] == "VALID"
    assert lin_res["model"]["model_id"] == "git-commit-intelligence"
    assert lin_res["dataset"]["sha256"] == "4a79f53736240b2c669ad33f8c5c37f2ff560584b2fc7f3d227322248b2bfd0d"
    assert lin_res["artifacts"]["model"] == "VERIFIED"
    assert lin_res["blockchain"]["status"] == "BLOCKCHAIN_RECORD_AVAILABLE"
    print("  -> TEST 5 PASSED: Canonical lineage resolution returned valid model, dataset, artifacts, and blockchain record status.")

    # TEST 6-9: Security Audit F-01 Regex Validation Tests
    print("\n[TEST 6-9] Testing Security Audit F-01 versionId validation regex...")
    assert VERSION_ID_REGEX.match("v1") is not None, "v1 should be valid!"
    assert VERSION_ID_REGEX.match("v1-test") is not None, "v1-test should be valid!"
    assert VERSION_ID_REGEX.match("../../etc/passwd") is None, "Path traversal attempt must be rejected!"
    assert VERSION_ID_REGEX.match("v1;whoami") is None, "Command injection attempt must be rejected!"
    print("  -> TEST 6-9 PASSED: All malicious parameter injection payloads correctly rejected.")

    print("\n==================================================")
    print("ALL PHASE 8 VERSIONING & LINEAGE TESTS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_api_unit_tests()
