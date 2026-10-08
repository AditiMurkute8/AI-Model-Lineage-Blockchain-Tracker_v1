import os
import json
import hashlib
from datetime import datetime
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_V2_PATH = os.path.join(BASE_DIR, "dataset", "git_commit_dataset_v2.csv")
MODEL_V2_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v2")

def generate_file_hash(file_path):
    if not os.path.exists(file_path):
        return None
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def train_v2_model():
    print("[INFO] Starting Git Commit Intelligence Model (v2) Training...")

    if not os.path.exists(DATASET_V2_PATH):
        raise FileNotFoundError(f"Dataset v2 not found at {DATASET_V2_PATH}")

    df = pd.read_csv(DATASET_V2_PATH)

    feature_cols = [
        "files_changed", "lines_added", "lines_deleted", "total_churn",
        "source_files", "test_files", "config_files", "doc_files", "dependency_files",
        "security_files", "database_files", "directories_touched", "files_added",
        "files_deleted", "files_modified", "files_renamed", "addition_deletion_ratio",
        "average_churn_per_file", "max_file_churn", "test_file_ratio", "source_file_ratio",
        "diff_hunk_count"
    ]
    target_col = "commit_type"

    X = df[feature_cols]
    y = df[target_col]

    # Stratified Train/Test Split (80/20) with fixed random_state
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Initialize & Fit Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    conf_mat = confusion_matrix(y_test, y_pred).tolist()
    class_names = sorted(list(y.unique()))
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    print(f"  Accuracy          : {acc:.4f}")
    print(f"  Macro Precision   : {prec_macro:.4f}")
    print(f"  Macro Recall      : {rec_macro:.4f}")
    print(f"  Macro F1          : {f1_macro:.4f}")
    print(f"  Weighted F1       : {f1_weighted:.4f}")

    os.makedirs(MODEL_V2_DIR, exist_ok=True)

    # Save v2 Model Artifact
    model_file_path = os.path.join(MODEL_V2_DIR, "model.pkl")
    joblib.dump(clf, model_file_path)

    # Calculate File Hashes
    dataset_name = os.path.basename(DATASET_V2_PATH)
    dataset_hash = generate_file_hash(DATASET_V2_PATH)
    model_hash = generate_file_hash(model_file_path)

    metadata = {
        "model_id": "git-commit-intelligence",
        "version_id": "v2",
        "algorithm": "Random Forest Classifier",
        "model_type": "Random Forest Classifier (22 Structural Features)",
        "accuracy": round(acc, 4),
        "precision": round(prec_macro, 4),
        "recall": round(rec_macro, 4),
        "f1_score": round(f1_macro, 4),
        "macro_precision": round(prec_macro, 4),
        "macro_recall": round(rec_macro, 4),
        "macro_f1": round(f1_macro, 4),
        "weighted_precision": round(prec_weighted, 4),
        "weighted_recall": round(rec_weighted, 4),
        "weighted_f1": round(f1_weighted, 4),
        "feature_names": feature_cols,
        "feature_count": len(feature_cols),
        "classes": class_names,
        "confusion_matrix": conf_mat,
        "per_class_metrics": {k: v for k, v in report_dict.items() if isinstance(v, dict)},
        "dataset_information": {
            "dataset_name": dataset_name,
            "samples_count": len(df),
            "feature_count": len(feature_cols),
            "dataset_hash": dataset_hash
        },
        "training_configuration": {
            "train_test_split": "80/20",
            "stratified": True,
            "random_state": 42,
            "n_estimators": 100
        },
        "creation_timestamp": datetime.now().isoformat(),
        "parent_version": "v1",
        "dataset_name": dataset_name,
        "dataset_hash": dataset_hash,
        "model_hash": model_hash,
        "experiment_note": "Git Commit Intelligence v2 eliminates commit-message keyword target leakage and uses 22 pure structural/diff features.",
        "limitation_note": "Because current dataset labels are weakly/deterministically derived based on commit context patterns, high evaluation scores on this dataset represent consistency on structural patterns rather than proven out-of-distribution real-world generalization.",
        "code_change_summary": "Migrated to 22 structural/diff features without keyword target leakage.",
        "code_snippet": "RandomForestClassifier(n_estimators=100, random_state=42)"
    }

    metadata_file_path = os.path.join(MODEL_V2_DIR, "metadata.json")
    with open(metadata_file_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)

    metadata_hash = generate_file_hash(metadata_file_path)

    integrity_data = {
        "model_id": "git-commit-intelligence",
        "version_id": "v2",
        "model_hash": model_hash,
        "dataset_hash": dataset_hash,
        "metadata_hash": metadata_hash,
        "timestamp": datetime.now().isoformat()
    }

    integrity_file_path = os.path.join(MODEL_V2_DIR, "model_integrity.json")
    with open(integrity_file_path, "w", encoding="utf-8") as f:
        json.dump(integrity_data, f, indent=4)

    print(f"\n[SUCCESS] Trained git-commit-intelligence v2 successfully!")
    print(f"  Model Hash   : {model_hash}")
    print(f"  Dataset Hash : {dataset_hash}")
    print(f"  Metadata Hash: {metadata_hash}")
    print(f"  Artifacts in : {MODEL_V2_DIR}")

if __name__ == "__main__":
    train_v2_model()
