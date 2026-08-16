import os
import sys
import json
import hashlib
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Any

from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FEATURES_PATH = os.path.join(BASE_DIR, "dataset", "git_commits", "features_v1.json")
MODEL_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v1")


def calculate_sha256(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()


def evaluate_model(model, X_train, y_train, X_eval, y_eval, labels: List[str], scaler=None) -> Dict[str, Any]:
    if scaler is not None:
        X_train_proc = scaler.transform(X_train)
        X_eval_proc = scaler.transform(X_eval)
    else:
        X_train_proc = X_train
        X_eval_proc = X_eval

    y_train_pred = model.predict(X_train_proc)
    y_eval_pred = model.predict(X_eval_proc)

    acc = accuracy_score(y_eval, y_eval_pred)
    macro_p = precision_score(y_eval, y_eval_pred, average="macro", zero_division=0)
    macro_r = recall_score(y_eval, y_eval_pred, average="macro", zero_division=0)
    macro_f1 = f1_score(y_eval, y_eval_pred, average="macro", zero_division=0)

    weighted_p = precision_score(y_eval, y_eval_pred, average="weighted", zero_division=0)
    weighted_r = recall_score(y_eval, y_eval_pred, average="weighted", zero_division=0)
    weighted_f1 = f1_score(y_eval, y_eval_pred, average="weighted", zero_division=0)

    cm = confusion_matrix(y_eval, y_eval_pred, labels=labels).tolist()
    cls_report = classification_report(y_eval, y_eval_pred, labels=labels, output_dict=True, zero_division=0)

    train_acc = accuracy_score(y_train, y_train_pred)
    train_macro_f1 = f1_score(y_train, y_train_pred, average="macro", zero_division=0)

    return {
        "accuracy": round(acc, 4),
        "macro_precision": round(macro_p, 4),
        "macro_recall": round(macro_r, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_precision": round(weighted_p, 4),
        "weighted_recall": round(weighted_r, 4),
        "weighted_f1": round(weighted_f1, 4),
        "train_accuracy": round(train_acc, 4),
        "train_macro_f1": round(train_macro_f1, 4),
        "confusion_matrix": cm,
        "classification_report": cls_report
    }


def train_and_evaluate_all():
    print("==================================================")
    print("GIT COMMIT INTELLIGENCE MODEL TRAINING & EVALUATION")
    print("==================================================\n")

    if not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"Feature dataset not found at '{FEATURES_PATH}'")

    dataset_hash = calculate_sha256(FEATURES_PATH)
    print(f"Dataset SHA-256: {dataset_hash}")

    with open(FEATURES_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    # Chronological sort by timestamp
    records.sort(key=lambda r: r.get("timestamp", ""))

    total_n = len(records)
    n_train = int(total_n * 0.70)
    n_val = int(total_n * 0.15)
    n_test = total_n - n_train - n_val

    train_recs = records[:n_train]
    val_recs = records[n_train:n_train + n_val]
    test_recs = records[n_train + n_val:]

    print(f"Dataset Split: Total={total_n} -> Train={len(train_recs)}, Val={len(val_recs)}, Test={len(test_recs)}")

    # Extract X and y
    feature_keys = sorted(list(records[0]["features"].keys()))
    print(f"Feature Vector Dimensions: {len(feature_keys)}")

    def build_matrix(recs):
        X_mat = np.array([[r["features"][k] for k in feature_keys] for r in recs])
        y_vec = np.array([r["target"] for r in recs])
        return X_mat, y_vec

    X_train, y_train = build_matrix(train_recs)
    X_val, y_val = build_matrix(val_recs)
    X_test, y_test = build_matrix(test_recs)

    labels = sorted(list(set(y_train) | set(y_val) | set(y_test)))
    print(f"Target Classes ({len(labels)}): {labels}\n")

    # Fit scaler on Train set only
    scaler = StandardScaler()
    scaler.fit(X_train)

    candidates = {}

    # Candidate 0: Baseline
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)
    candidates["Baseline (Majority)"] = {
        "model": dummy,
        "scaler": None,
        "algorithm": "DummyClassifier (Majority Class)",
        "val_eval": evaluate_model(dummy, X_train, y_train, X_val, y_val, labels),
        "test_eval": evaluate_model(dummy, X_train, y_train, X_test, y_test, labels)
    }

    # Candidate 1: Logistic Regression
    lr = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    lr.fit(scaler.transform(X_train), y_train)
    candidates["Logistic Regression"] = {
        "model": lr,
        "scaler": scaler,
        "algorithm": "Logistic Regression",
        "val_eval": evaluate_model(lr, X_train, y_train, X_val, y_val, labels, scaler=scaler),
        "test_eval": evaluate_model(lr, X_train, y_train, X_test, y_test, labels, scaler=scaler)
    }

    # Candidate 2: Decision Tree
    dt = DecisionTreeClassifier(max_depth=8, min_samples_split=5, class_weight="balanced", random_state=42)
    dt.fit(X_train, y_train)
    candidates["Decision Tree"] = {
        "model": dt,
        "scaler": None,
        "algorithm": "Decision Tree Classifier",
        "val_eval": evaluate_model(dt, X_train, y_train, X_val, y_val, labels),
        "test_eval": evaluate_model(dt, X_train, y_train, X_test, y_test, labels)
    }

    # Candidate 3: Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=10, min_samples_split=4, class_weight="balanced", random_state=42)
    rf.fit(X_train, y_train)
    candidates["Random Forest"] = {
        "model": rf,
        "scaler": None,
        "algorithm": "Random Forest Classifier",
        "val_eval": evaluate_model(rf, X_train, y_train, X_val, y_val, labels),
        "test_eval": evaluate_model(rf, X_train, y_train, X_test, y_test, labels)
    }

    # Candidate 4: Support Vector Machine (SVM)
    svm = SVC(kernel="rbf", C=1.0, probability=True, class_weight="balanced", random_state=42)
    svm.fit(scaler.transform(X_train), y_train)
    candidates["SVM"] = {
        "model": svm,
        "scaler": scaler,
        "algorithm": "Support Vector Machine (RBF Kernel)",
        "val_eval": evaluate_model(svm, X_train, y_train, X_val, y_val, labels, scaler=scaler),
        "test_eval": evaluate_model(svm, X_train, y_train, X_test, y_test, labels, scaler=scaler)
    }

    # Print Candidate Leaderboard
    print(f"{'Model Name':<24} | {'Val Acc':<8} | {'Val Macro-F1':<13} | {'Val W-F1':<9} | {'Test Acc':<8} | {'Test Macro-F1':<13}")
    print("-" * 87)
    for name, c in candidates.items():
        ve = c["val_eval"]
        te = c["test_eval"]
        print(f"{name:<24} | {ve['accuracy']:<8.4f} | {ve['macro_f1']:<13.4f} | {ve['weighted_f1']:<9.4f} | {te['accuracy']:<8.4f} | {te['macro_f1']:<13.4f}")


    # Select Winner based on highest Validation Macro-F1 (excluding Baseline)
    ml_candidates = {k: v for k, v in candidates.items() if k != "Baseline (Majority)"}
    winner_name = max(ml_candidates, key=lambda k: ml_candidates[k]["val_eval"]["macro_f1"])
    winner_info = ml_candidates[winner_name]

    print(f"\n==================================================")
    print(f"WINNING MODEL SELECTED: {winner_name}")
    print(f"Validation Macro-F1: {winner_info['val_eval']['macro_f1']}")
    print(f"Test Macro-F1:       {winner_info['test_eval']['macro_f1']}")
    print(f"==================================================\n")

    # Save Winner Artifacts to model_versions/git-commit-intelligence/v1/
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_file = os.path.join(MODEL_DIR, "model.pkl")
    with open(model_file, "wb") as f:
        pickle.dump(winner_info["model"], f)

    scaler_file = None
    if winner_info["scaler"] is not None:
        scaler_file = os.path.join(MODEL_DIR, "scaler.pkl")
        with open(scaler_file, "wb") as f:
            pickle.dump(winner_info["scaler"], f)

    meta_file = os.path.join(MODEL_DIR, "metadata.json")
    metadata = {
        "model_id": "git-commit-intelligence",
        "version_id": "v1",
        "algorithm": winner_info["algorithm"],
        "task": "commit_type_classification",
        "target": "commit_type",
        "num_features": len(feature_keys),
        "num_training_samples": len(train_recs),
        "num_validation_samples": len(val_recs),
        "num_test_samples": len(test_recs),
        "classes": labels,
        "feature_keys": feature_keys,
        "training_timestamp": datetime.now().isoformat(),
        "previous_version": None,
        "dataset_name": "features_v1.json",
        "dataset_hash": dataset_hash,
        "feature_schema_version": "v1",
        "experiment_note": f"Phase 5 Winner selected via highest Validation Macro-F1 ({winner_info['val_eval']['macro_f1']}) across 4 candidate algorithms.",
        "evaluation_metrics": {
            "validation": winner_info["val_eval"],
            "test": winner_info["test_eval"]
        },
        "candidate_leaderboard": {
            k: {
                "val_accuracy": v["val_eval"]["accuracy"],
                "val_macro_f1": v["val_eval"]["macro_f1"],
                "test_accuracy": v["test_eval"]["accuracy"],
                "test_macro_f1": v["test_eval"]["macro_f1"]
            } for k, v in candidates.items()
        }
    }

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"Artifacts successfully written to {MODEL_DIR}")
    return metadata


if __name__ == "__main__":
    train_and_evaluate_all()
