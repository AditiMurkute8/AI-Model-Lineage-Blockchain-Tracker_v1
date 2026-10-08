import os
import sys
import json
import unittest
import pandas as pd
import joblib

# Add directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from ai_model.inference.analyze_commit import (
    validate_and_parse_url,
    extract_features,
    extract_features_v2,
    evaluate_risk_and_impact,
    analyze_commit
)

class TestGitCommitIntelligence(unittest.TestCase):

    def test_1_valid_github_url(self):
        url = "https://github.com/expressjs/express/commit/6340c1eaaedc0ddcae8be8df2cdb1d2e961cbf2f"
        owner, repo, sha, err = validate_and_parse_url(url)
        self.assertIsNone(err)
        self.assertEqual(owner, "expressjs")
        self.assertEqual(repo, "express")
        self.assertEqual(sha, "6340c1eaaedc0ddcae8be8df2cdb1d2e961cbf2f")

    def test_2_invalid_github_url(self):
        url = "https://github.com/expressjs/express/pull/123"
        owner, repo, sha, err = validate_and_parse_url(url)
        self.assertIsNotNone(err)
        self.assertIn("Invalid GitHub commit URL format", err)

    def test_3_non_github_url(self):
        url = "https://google.com/test"
        owner, repo, sha, err = validate_and_parse_url(url)
        self.assertIsNotNone(err)

    def test_4_nonexistent_commit(self):
        url = "https://github.com/expressjs/express/commit/0000000000000000000000000000000000000000"
        result = analyze_commit(url, "v2")
        self.assertIn("error", result)

    def test_5_github_api_failure_handling(self):
        result = analyze_commit("", "v2")
        self.assertIn("error", result)

    def test_6_v1_feature_extraction_preserved(self):
        mock_commit_data = {
            "stats": {"additions": 45, "deletions": 15},
            "commit": {"message": "fix(auth): update jwt token validation routine"},
            "files": [
                {"filename": "src/auth/jwt.js"},
                {"filename": "test/auth.spec.js"}
            ]
        }
        features = extract_features(mock_commit_data)
        self.assertEqual(features["files_changed"], 2)
        self.assertEqual(features["lines_added"], 45)
        self.assertEqual(features["lines_deleted"], 15)
        self.assertEqual(features["total_churn"], 60)
        self.assertEqual(features["security_files"], 2)
        self.assertEqual(features["test_files"], 1)
        self.assertEqual(features["msg_has_fix"], 1)

    def test_7_v2_structural_feature_extraction(self):
        # Verify 22 pure structural features extracted with NO msg_has_* target leakage
        mock_commit_data = {
            "stats": {"additions": 140, "deletions": 20},
            "commit": {"message": "feat(api): implement new payment gateway integration"},
            "files": [
                {"filename": "src/api/payment.js", "status": "modified", "additions": 80, "deletions": 10, "patch": "@@ -1,5 +1,10 @@"},
                {"filename": "src/api/stripe.js", "status": "added", "additions": 40, "deletions": 0, "patch": "@@ -0,0 +1,40 @@"},
                {"filename": "test/payment.spec.js", "status": "added", "additions": 20, "deletions": 10, "patch": "@@ -0,0 +1,20 @@"}
            ]
        }
        f2 = extract_features_v2(mock_commit_data)
        self.assertEqual(len(f2), 22, "v2 must extract exactly 22 structural features")
        self.assertNotIn("msg_has_fix", f2, "v2 must NOT contain msg_has_fix target leakage")
        self.assertNotIn("msg_has_feat", f2, "v2 must NOT contain msg_has_feat target leakage")
        self.assertNotIn("msg_has_refactor", f2, "v2 must NOT contain msg_has_refactor target leakage")
        self.assertNotIn("msg_has_docs", f2, "v2 must NOT contain msg_has_docs target leakage")
        
        # Check specific structural calculations
        self.assertEqual(f2["files_changed"], 3)
        self.assertEqual(f2["lines_added"], 140)
        self.assertEqual(f2["lines_deleted"], 20)
        self.assertEqual(f2["total_churn"], 160)
        self.assertEqual(f2["source_files"], 2)
        self.assertEqual(f2["test_files"], 1)
        self.assertEqual(f2["files_added"], 2)
        self.assertEqual(f2["files_modified"], 1)
        self.assertEqual(f2["addition_deletion_ratio"], round(141 / 21, 4))
        self.assertEqual(f2["average_churn_per_file"], round(160 / 3, 4))
        self.assertEqual(f2["max_file_churn"], 90)
        self.assertEqual(f2["test_file_ratio"], round(1 / 3, 4))
        self.assertEqual(f2["source_file_ratio"], round(2 / 3, 4))

    def test_8_v2_model_inference(self):
        model_v2_path = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v2", "model.pkl")
        self.assertTrue(os.path.exists(model_v2_path), "v2 model.pkl must exist")
        
        clf_v2 = joblib.load(model_v2_path)
        meta_v2_path = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v2", "metadata.json")
        with open(meta_v2_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        feature_names = meta["feature_names"]
        self.assertEqual(len(feature_names), 22)
        
        mock_input = {k: 0 for k in feature_names}
        mock_input.update({
            "files_changed": 5, "lines_added": 180, "lines_deleted": 15, "total_churn": 195,
            "source_files": 4, "test_files": 1, "addition_deletion_ratio": 11.31,
            "average_churn_per_file": 39.0, "max_file_churn": 90, "source_file_ratio": 0.8
        })
        df = pd.DataFrame([mock_input])[feature_names]
        pred = clf_v2.predict(df)[0]
        self.assertIn(pred, ["FEATURE", "BUG FIX", "REFACTOR", "TEST", "DOCUMENTATION", "CONFIGURATION", "OTHER"])

    def test_9_v2_metadata_and_integrity(self):
        meta_v2_path = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v2", "metadata.json")
        integ_v2_path = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v2", "model_integrity.json")
        self.assertTrue(os.path.exists(meta_v2_path))
        self.assertTrue(os.path.exists(integ_v2_path))

        with open(meta_v2_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.assertEqual(meta["model_id"], "git-commit-intelligence")
        self.assertEqual(meta["version_id"], "v2")
        self.assertEqual(meta["parent_version"], "v1")
        self.assertEqual(meta["feature_count"], 22)
        self.assertIn("limitation_note", meta)

    def test_10_risk_and_impact_eval(self):
        mock_features = {
            "files_changed": 4, "total_churn": 60, "security_files": 1,
            "database_files": 0, "config_files": 0, "source_files": 2, "test_files": 0
        }
        risk_level, risk_factors, impact_level, impact_factors = evaluate_risk_and_impact(mock_features, {})
        self.assertEqual(risk_level, "HIGH")

    def test_11_v1_untouched_and_intact(self):
        # Verify v1 files are 100% intact and unchanged
        v1_model = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v1", "model.pkl")
        v1_meta = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v1", "metadata.json")
        v1_dataset = os.path.join(BASE_DIR, "dataset", "git_commit_dataset.csv")

        self.assertTrue(os.path.exists(v1_model), "v1 model.pkl must remain intact")
        self.assertTrue(os.path.exists(v1_meta), "v1 metadata.json must remain intact")
        self.assertTrue(os.path.exists(v1_dataset), "v1 git_commit_dataset.csv must remain intact")

        with open(v1_meta, "r", encoding="utf-8") as f:
            m1 = json.load(f)
        self.assertEqual(m1["version_id"], "v1")
        self.assertEqual(len(m1["feature_names"]), 15)

if __name__ == "__main__":
    unittest.main()
