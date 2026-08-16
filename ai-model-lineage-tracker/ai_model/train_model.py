import os
import json
import hashlib
from datetime import datetime
import pandas as pd
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

from sklearn.metrics import accuracy_score, precision_score, recall_score

# ================= PATH =================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions")
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "dataset_v2.csv")
TEMP_PATH = os.path.join(BASE_DIR, "temp_experiment.json")


# ================= LOAD INPUT =================
def load_input():
    if os.path.exists(TEMP_PATH):
        with open(TEMP_PATH, "r") as f:
            return json.load(f)
    return {}


# ================= DATASET HASH =================
def generate_dataset_hash(file_path):
    if not os.path.exists(file_path):
        return None

    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)

    return sha256.hexdigest()


# ================= STANDALONE ALGORITHM TRAINERS =================
def fit_logistic_regression(X, y):
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    return model, "Logistic Regression"


def fit_decision_tree(X, y):
    model = DecisionTreeClassifier(random_state=42)
    model.fit(X, y)
    return model, "Decision Tree"


def fit_random_forest(X, y):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model, "Random Forest"


def fit_svm(X, y):
    model = SVC(probability=True)
    model.fit(X, y)
    return model, "Support Vector Machine"


# ================= DISPATCHER =================
def fit_model(model_id, X, y):
    if model_id == "logistic-regression":
        return fit_logistic_regression(X, y)

    elif model_id == "decision-tree":
        return fit_decision_tree(X, y)

    elif model_id == "random-forest":
        return fit_random_forest(X, y)

    elif model_id == "svm":
        return fit_svm(X, y)

    else:
        return fit_logistic_regression(X, y)


# ================= MAIN TRAIN FUNCTION =================
def train_new_version():
    data_input = load_input()
    model_id = data_input.get("model_id", "logistic-regression")

    # ================= LOAD DATA =================
    data = pd.read_csv(DATASET_PATH)
    X = data.drop("label", axis=1)
    y = data["label"]

    dataset_name = os.path.basename(DATASET_PATH)
    dataset_hash = generate_dataset_hash(DATASET_PATH)

    # ================= TRAIN MODEL =================
    model, model_name = fit_model(model_id, X, y)
    y_pred = model.predict(X)

    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred, zero_division=0)
    recall = recall_score(y, y_pred, zero_division=0)

    # ================= VERSIONING =================
    model_path = os.path.join(MODEL_DIR, model_id)
    os.makedirs(model_path, exist_ok=True)

    versions = [
        v for v in os.listdir(model_path)
        if v.startswith("v") and os.path.isdir(os.path.join(model_path, v))
    ]

    if versions:
        last = sorted(versions, key=lambda x: int(x[1:]))[-1]
        version_num = int(last[1:]) + 1
        previous = last
    else:
        version_num = 1
        previous = None

    version_id = f"v{version_num}"
    version_path = os.path.join(model_path, version_id)
    os.makedirs(version_path, exist_ok=True)

    # ================= SAVE MODEL =================
    model_file = os.path.join(version_path, "model.pkl")
    joblib.dump(model, model_file)

    # ================= METADATA =================
    metadata = {
        "model_id": model_id,
        "version_id": version_id,
        "model_type": model_name,

        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),

        "training_time": datetime.now().isoformat(),
        "previous_version": previous,

        "dataset_name": dataset_name,
        "dataset_hash": dataset_hash,

        "experiment_note": data_input.get("experiment_note", "No notes"),
        "code_change_summary": data_input.get("code_change_summary", "No changes"),
        "code_snippet": data_input.get("code_snippet", "N/A"),
    }

    with open(os.path.join(version_path, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)

    print(f"{model_id} -> {version_id} trained successfully")
    return metadata


# ================= RUN DIRECTLY =================
if __name__ == "__main__":
    train_new_version()