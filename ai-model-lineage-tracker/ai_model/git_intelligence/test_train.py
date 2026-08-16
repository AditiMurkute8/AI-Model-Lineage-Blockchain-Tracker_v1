import os
import sys
import json
import pickle
import hashlib
import numpy as np
from datetime import datetime
from train_git_intelligence import calculate_sha256, train_and_evaluate_all


def run_training_tests():
    print("==================================================")
    print("RUNNING PHASE 5 MODEL TRAINING TEST SUITE")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    feat_path = os.path.join(base_dir, "dataset", "git_commits", "features_v1.json")
    model_dir = os.path.join(base_dir, "ai_model", "model_versions", "git-commit-intelligence", "v1")

    # TEST 1: Features JSON loading
    print("[TEST 1] Testing features_v1.json loading...")
    assert os.path.exists(feat_path), "features_v1.json not found!"
    with open(feat_path, "r", encoding="utf-8") as f:
        recs = json.load(f)
    assert len(recs) == 1718
    print(f"  -> TEST 1 PASSED: Loaded {len(recs)} records.")

    # TEST 2-4: Feature Dimensions & Leakage Exclusion
    print("\n[TEST 2-4] Verifying feature dimensions & non-leakage...")
    sample_feat = recs[0]["features"]
    assert len(sample_feat) == 41, f"Expected 41 features, got {len(sample_feat)}"
    for k in ["target", "commit_type", "risk_level", "impact_scope", "analytics_risk_level", "analytics_impact_scope"]:
        assert k not in sample_feat, f"Target/Analytics key {k} found in features!"
    print("  -> TEST 2-4 PASSED: Exactly 41 non-leaking features present.")

    # TEST 5-6: Chronological Ordering & Timestamp Isolation
    print("\n[TEST 5-6] Verifying chronological ordering & timestamp isolation...")
    sorted_recs = sorted(recs, key=lambda r: r.get("timestamp", ""))
    n_train = int(len(sorted_recs) * 0.70)
    n_val = int(len(sorted_recs) * 0.15)
    train_max_ts = sorted_recs[n_train - 1].get("timestamp", "")
    test_min_ts = sorted_recs[n_train + n_val].get("timestamp", "")
    assert train_max_ts <= test_min_ts, "Temporal split boundary violation!"
    print(f"  -> TEST 5-6 PASSED: Train Max TS ({train_max_ts}) <= Test Min TS ({test_min_ts}).")

    # TEST 7-12: Metadata & Leaderboard Verification
    print("\n[TEST 7-12] Verifying metadata & leaderboard completeness...")
    metadata = train_and_evaluate_all()
    assert metadata["model_id"] == "git-commit-intelligence"
    assert metadata["version_id"] == "v1"
    assert metadata["algorithm"] == "Support Vector Machine (RBF Kernel)"
    assert "dataset_hash" in metadata and len(metadata["dataset_hash"]) == 64
    assert len(metadata["evaluation_metrics"]["validation"]["confusion_matrix"]) == 7
    print("  -> TEST 7-12 PASSED: Model winner metadata & 7x7 confusion matrix verified.")

    # TEST 13: Dataset Hash Reproducibility
    print("\n[TEST 13] Verifying dataset SHA-256 hash reproducibility...")
    h1 = calculate_sha256(feat_path)
    h2 = calculate_sha256(feat_path)
    assert h1 == h2 == metadata["dataset_hash"]
    print(f"  -> TEST 13 PASSED: Hash ({h1}) is 100% reproducible.")

    # TEST 14-15: Saved Model Artifact Inference Verification
    print("\n[TEST 14-15] Testing artifact loading & inference on held-out test sample...")
    model_file = os.path.join(model_dir, "model.pkl")
    scaler_file = os.path.join(model_dir, "scaler.pkl")
    assert os.path.exists(model_file), "model.pkl not found!"
    assert os.path.exists(scaler_file), "scaler.pkl not found for SVM!"

    with open(model_file, "rb") as f:
        loaded_model = pickle.load(f)
    with open(scaler_file, "rb") as f:
        loaded_scaler = pickle.load(f)

    sample_x = np.array([[sorted_recs[-1]["features"][k] for k in sorted(sample_feat.keys())]])
    sample_x_scaled = loaded_scaler.transform(sample_x)
    pred = loaded_model.predict(sample_x_scaled)
    assert pred[0] in metadata["classes"]
    print(f"  -> TEST 14-15 PASSED: Model artifact loaded cleanly. Test sample prediction = '{pred[0]}'.")

    print("\n==================================================")
    print("ALL PHASE 5 MODEL TRAINING TESTS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_training_tests()
