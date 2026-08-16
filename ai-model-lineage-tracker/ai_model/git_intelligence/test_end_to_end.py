import os
import sys
import json
import subprocess
from predict import predict_git_commit
from lineage import verify_model_lineage
from version_registry import get_model_version, validate_model_version, resolve_lineage


def run_full_regression_and_e2e_tests():
    print("==================================================")
    print("RUNNING PHASE 10 END-TO-END & REGRESSION TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    git_intel_dir = os.path.join(base_dir, "ai_model", "git_intelligence")

    # Run all 12 test suites sequentially
    test_files = [
        "test_extract.py",
        "test_preprocess.py",
        "test_features.py",
        "test_train.py",
        "test_lineage.py",
        "test_blockchain.py",
        "test_remix.py",
        "test_predict.py",
        "test_api.py",
        "test_versioning.py",
        "test_retrain.py",
        "test_blockchain_v2.py"
    ]

    print("[REGRESSION AUDIT] Executing test suite runner across all phases...")
    for t_file in test_files:
        t_path = os.path.join(git_intel_dir, t_file)
        if os.path.exists(t_path):
            res = subprocess.run([sys.executable, t_path], cwd=base_dir, capture_output=True, text=True)
            assert res.returncode == 0, f"Regression test failure in '{t_file}':\n{res.stderr}\n{res.stdout}"
            print(f"  -> {t_file}: PASSED")

    # End-to-End Prediction Workflow Verification on v1 and v2
    print("\n[E2E WORKFLOW 1] Testing end-to-end Git commit prediction pipeline across v1 and v2...")
    commit_input = {
        "message": "fix: correct overflow bug in packet parser",
        "files_changed": ["src/parser/packet.c", "tests/test_packet.c"],
        "lines_added": 14,
        "lines_deleted": 3,
        "num_files_modified": 2,
        "diff": "--- src/parser/packet.c\n+++ src/parser/packet.c\n+if (len > MAX_BUF) return -1;"
    }

    pred_v1 = predict_git_commit(commit_input, version_id="v1")
    pred_v2 = predict_git_commit(commit_input, version_id="v2")

    assert pred_v1["success"] is True and pred_v1["version_id"] == "v1"
    assert pred_v2["success"] is True and pred_v2["version_id"] == "v2"
    print(f"  -> E2E PREDICTION PASSED: v1='{pred_v1['prediction']}', v2='{pred_v2['prediction']}'.")

    # End-to-End Lineage Workflow Verification on v1 and v2
    print("\n[E2E WORKFLOW 2] Testing end-to-end lineage resolution across v1 and v2...")
    lin_v1 = resolve_lineage("git-commit-intelligence", "v1")
    lin_v2 = resolve_lineage("git-commit-intelligence", "v2")

    assert lin_v1["status"] == "VALID" and lin_v1["blockchain"]["status"] == "BLOCKCHAIN_RECORD_AVAILABLE"
    assert lin_v2["status"] == "VALID" and lin_v2["blockchain"]["status"] == "BLOCKCHAIN_RECORD_AVAILABLE"
    print(f"  -> E2E LINEAGE PASSED: v1 status='{lin_v1['status']}', v2 status='{lin_v2['status']}'.")

    print("\n==================================================")
    print("ALL PHASE 10 END-TO-END & REGRESSION TESTS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_full_regression_and_e2e_tests()
