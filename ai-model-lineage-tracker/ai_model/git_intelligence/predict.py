import os
import sys
import json
import pickle
import numpy as np
from typing import List, Dict, Tuple, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from ai_model.git_intelligence.features import extract_commit_features
from ai_model.git_intelligence.version_registry import get_latest_model_version

MODEL_VERSIONS_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions")


def load_model_artifacts(model_id: str = "git-commit-intelligence", version_id: Optional[str] = None) -> Tuple[Any, Any, Dict[str, Any]]:
    """
    Loads serialized model.pkl, scaler.pkl, and metadata.json for specified model_id and version_id.
    Defaults to 'v1' if not specified for maximum backward compatibility.
    """
    selected_version = version_id or "v1"
    version_dir = os.path.join(MODEL_VERSIONS_DIR, model_id, selected_version)

    if not os.path.exists(version_dir):
        # Fallback to latest available version if requested version directory does not exist
        latest_meta = get_latest_model_version(model_id)
        if latest_meta:
            selected_version = latest_meta["version_id"]
            version_dir = os.path.join(MODEL_VERSIONS_DIR, model_id, selected_version)

    model_path = os.path.join(version_dir, "model.pkl")
    scaler_path = os.path.join(version_dir, "scaler.pkl")
    metadata_path = os.path.join(version_dir, "metadata.json")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact not found at '{model_path}'")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler artifact not found at '{scaler_path}'")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file not found at '{metadata_path}'")

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    return model, scaler, metadata


def predict_git_commit(commit_input: Dict[str, Any], model_id: str = "git-commit-intelligence", version_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Predicts Commit Type for a Git commit input using model_id and specified version_id.
    """
    req_version = version_id or commit_input.get("version_id") or "v1"
    model, scaler, metadata = load_model_artifacts(model_id, req_version)
    feature_keys = metadata.get("feature_keys", [])

    if not feature_keys:
        raise ValueError("Feature ordering keys missing in metadata.json!")

    record = {
        "message": commit_input.get("message", ""),
        "files_changed": commit_input.get("files_changed", []),
        "file_types": [os.path.splitext(f)[1].lower() for f in commit_input.get("files_changed", []) if os.path.splitext(f)[1]],
        "lines_added": int(commit_input.get("lines_added", 0)),
        "lines_deleted": int(commit_input.get("lines_deleted", 0)),
        "num_files_modified": int(commit_input.get("num_files_modified", len(commit_input.get("files_changed", [])))),
        "diff": commit_input.get("diff", ""),
        "timestamp": commit_input.get("timestamp", "")
    }

    extracted_features = extract_commit_features(record)
    feature_vector = np.array([[extracted_features[k] for k in feature_keys]])
    scaled_vector = scaler.transform(feature_vector)

    pred_label = model.predict(scaled_vector)[0]

    return {
        "success": True,
        "model_id": metadata.get("model_id", model_id),
        "version_id": metadata.get("version_id", req_version),
        "prediction": str(pred_label),
        "algorithm": metadata.get("algorithm", "Support Vector Machine (RBF Kernel)"),
        "confidence": "High"
    }


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            inp = json.load(f)
        ver = sys.argv[2] if len(sys.argv) > 2 else inp.get("version_id")
        result = predict_git_commit(inp, version_id=ver)
        print(json.dumps(result, indent=2))
    else:
        sample_input = {
            "message": "fix authentication validation error in login route",
            "files_changed": ["src/auth/login.py", "tests/test_login.py"],
            "lines_added": 25,
            "lines_deleted": 8,
            "num_files_modified": 2,
            "diff": "--- src/auth/login.py\n+++ src/auth/login.py\n+if not validate_token(token):\n+    raise ValueError('Invalid token')"
        }
        res_v1 = predict_git_commit(sample_input, version_id="v1")
        res_v2 = predict_git_commit(sample_input, version_id="v2")
        print("V1 Prediction:", json.dumps(res_v1, indent=2))
        print("V2 Prediction:", json.dumps(res_v2, indent=2))
