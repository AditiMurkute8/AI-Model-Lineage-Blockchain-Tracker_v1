import os
import sys
import json
import hashlib
import pickle
import argparse
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional

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
sys.path.insert(0, BASE_DIR)

from hashing.hash_utils import generate_file_hash

FEATURES_PATH = os.path.join(BASE_DIR, "dataset", "git_commits", "features_v1.json")
MODEL_VERSIONS_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions")


def calculate_sha256(file_path: str) -> str:
    return generate_file_hash(file_path)


def discover_next_version(model_id: str) -> Tuple[str, str]:
    """
    Scans model_versions/<model_id>/ to discover existing versions and returns (next_version_id, previous_version_id).
    Example: if only v1 exists -> returns ("v2", "v1").
    """
    model_path = os.path.join(MODEL_VERSIONS_DIR, model_id)
    if not os.path.exists(model_path):
        os.makedirs(model_path, exist_ok=True)
        return "v1", None

    existing_v = [
        int(v[1:]) for v in os.listdir(model_path)
        if os.path.isdir(os.path.join(model_path, v)) and v.startswith("v") and v[1:].isdigit()
    ]

    if not existing_v:
        return "v1", None

    latest_num = max(existing_v)
    next_num = latest_num + 1
    return f"v{next_num}", f"v{latest_num}"


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


def retrain_model_version(
    model_id: str = "git-commit-intelligence",
    note_summary: Optional[str] = None,
    code_changes: Optional[str] = None,
    experimental_notes: Optional[str] = None,
    experiment_note: Optional[str] = None,
    code_change_summary: Optional[str] = None,
    code_snippet: Optional[str] = None,
    target_dir_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Phase 9 Retraining Workflow:
    Loads features_v1.json, runs 70/15/15 chronological split, evaluates 5 candidate algorithms,
    selects winner via Validation Macro-F1, creates next version directory, saves model.pkl,
    scaler.pkl, metadata.json, model_integrity.json, and blockchain_registration_payload.json.
    Accepts user metadata (note_summary, code_changes, experimental_notes) and persists them.
    """
    if not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"Feature dataset not found at '{FEATURES_PATH}'")

    if target_dir_override:
        target_dir = target_dir_override
        next_version = os.path.basename(target_dir.rstrip("/\\"))
        _, previous_version = discover_next_version(model_id)
    else:
        next_version, previous_version = discover_next_version(model_id)
        target_dir = os.path.join(MODEL_VERSIONS_DIR, model_id, next_version)

        if os.path.exists(target_dir):
            raise FileExistsError(f"Target version directory '{target_dir}' already exists! Refusing to overwrite.")

    dataset_hash = calculate_sha256(FEATURES_PATH)

    with open(FEATURES_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    # Sort chronologically by timestamp
    records.sort(key=lambda r: r.get("timestamp", ""))

    total_n = len(records)
    n_train = int(total_n * 0.70)
    n_val = int(total_n * 0.15)
    n_test = total_n - n_train - n_val

    train_recs = records[:n_train]
    val_recs = records[n_train:n_train + n_val]
    test_recs = records[n_train + n_val:]

    feature_keys = sorted(list(records[0]["features"].keys()))

    def build_matrix(recs):
        X_mat = np.array([[r["features"][k] for k in feature_keys] for r in recs])
        y_vec = np.array([r["target"] for r in recs])
        return X_mat, y_vec

    X_train, y_train = build_matrix(train_recs)
    X_val, y_val = build_matrix(val_recs)
    X_test, y_test = build_matrix(test_recs)

    labels = sorted(list(set(y_train) | set(y_val) | set(y_test)))

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

    # Select Winner via Validation Macro-F1
    ml_candidates = {k: v for k, v in candidates.items() if k != "Baseline (Majority)"}
    winner_name = max(ml_candidates, key=lambda k: ml_candidates[k]["val_eval"]["macro_f1"])
    winner_info = ml_candidates[winner_name]

    os.makedirs(target_dir, exist_ok=True)

    model_file = os.path.join(target_dir, "model.pkl")
    with open(model_file, "wb") as f:
        pickle.dump(winner_info["model"], f)

    scaler_file = os.path.join(target_dir, "scaler.pkl")
    if winner_info["scaler"] is not None:
        with open(scaler_file, "wb") as f:
            pickle.dump(winner_info["scaler"], f)

    final_experiment_note = (note_summary or experiment_note or "").strip()
    if not final_experiment_note:
        final_experiment_note = f"Phase 9 Retraining Winner ({winner_name}) selected via highest Validation Macro-F1 ({winner_info['val_eval']['macro_f1']})."

    final_code_change_summary = (code_changes or code_change_summary or "").strip()
    if not final_code_change_summary:
        final_code_change_summary = "No changes"

    final_code_snippet = (experimental_notes or code_snippet or "").strip()
    if not final_code_snippet:
        final_code_snippet = "N/A"

    now_iso = datetime.now().isoformat()

    meta_file = os.path.join(target_dir, "metadata.json")
    metadata = {
        "model_id": model_id,
        "version_id": next_version,
        "algorithm": winner_info["algorithm"],
        "task": "commit_type_classification",
        "target": "commit_type",
        "num_features": len(feature_keys),
        "num_training_samples": len(train_recs),
        "num_validation_samples": len(val_recs),
        "num_test_samples": len(test_recs),
        "classes": labels,
        "feature_keys": feature_keys,
        "training_time": now_iso,
        "training_timestamp": now_iso,
        "created_at": now_iso,
        "previous_version": previous_version,
        "dataset_name": "features_v1.json",
        "dataset_hash": dataset_hash,
        "feature_schema_version": "v1",
        "experiment_note": final_experiment_note,
        "code_change_summary": final_code_change_summary,
        "code_snippet": final_code_snippet,
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

    # Step 7: Generate model_integrity.json
    model_hash = calculate_sha256(model_file)
    scaler_hash = calculate_sha256(scaler_file) if os.path.exists(scaler_file) else ""
    meta_hash = calculate_sha256(meta_file)

    manifest_path = os.path.join(target_dir, "model_integrity.json")
    manifest = {
        "model_id": model_id,
        "version_id": next_version,
        "algorithm": winner_info["algorithm"],
        "model_hash": model_hash,
        "scaler_hash": scaler_hash,
        "metadata_hash": meta_hash,
        "dataset_hash": dataset_hash,
        "hash_algorithm": "SHA-256",
        "generated_at": now_iso
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    # Verify integrity immediately
    if calculate_sha256(model_file) != model_hash or (scaler_hash and calculate_sha256(scaler_file) != scaler_hash):
        raise ValueError("Local integrity verification failed immediately after writing artifacts!")

    # Step 8: Generate blockchain_registration_payload.json
    payload_path = os.path.join(target_dir, "blockchain_registration_payload.json")
    payload = {
        "model_id": model_id,
        "version_id": next_version,
        "dataset_hash": dataset_hash,
        "contract_function": "registerModelVersion",
        "status": "BLOCKCHAIN REGISTRATION PENDING",
        "created_at": now_iso
    }

    with open(payload_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    result = {
        "success": True,
        "modelId": model_id,
        "versionId": next_version,
        "previousVersion": previous_version,
        "algorithm": winner_info["algorithm"],
        "validationMacroF1": winner_info["val_eval"]["macro_f1"],
        "testMacroF1": winner_info["test_eval"]["macro_f1"],
        "datasetHash": dataset_hash,
        "integrityStatus": "VERIFIED",
        "blockchainStatus": "PENDING",
        "experiment_note": final_experiment_note,
        "code_change_summary": final_code_change_summary,
        "code_snippet": final_code_snippet,
        "training_time": now_iso
    }

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Phase 9 Git Commit Intelligence Retraining")
    parser.add_argument("--model-id", default="git-commit-intelligence", help="Model ID to retrain")
    parser.add_argument("--note-summary", "--experiment-note", default="", help="Experiment note summary")
    parser.add_argument("--code-changes", "--code-change-summary", default="", help="Code changes summary")
    parser.add_argument("--experimental-notes", "--code-snippet", default="", help="Experimental notes / code snippet")
    args = parser.parse_args()

    res = retrain_model_version(
        model_id=args.model_id,
        note_summary=args.note_summary,
        code_changes=args.code_changes,
        experimental_notes=args.experimental_notes
    )
    print(json.dumps(res, indent=2))

