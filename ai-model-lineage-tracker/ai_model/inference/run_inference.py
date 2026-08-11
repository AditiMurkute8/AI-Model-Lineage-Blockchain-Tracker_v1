import os
import json
import joblib
import hashlib
from datetime import datetime
import pandas as pd

# ---------------- CONFIG ----------------
MODEL_VERSION = "v6"

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ai_model",
    "model_versions",
    MODEL_VERSION,
    "model.pkl"
)

INFERENCE_LOG_PATH = os.path.join(
    BASE_DIR,
    "ai_model",
    "inference",
    "inference_logs.json"
)
# ----------------------------------------

# Load trained model
model = joblib.load(MODEL_PATH)

# Example inference input (must match training features)
input_data = {
    "age": 29,
    "income": 42000
}

# Convert input to DataFrame (IMPORTANT)
input_df = pd.DataFrame([input_data])

# Hash input
input_string = json.dumps(input_data, sort_keys=True)
input_hash = hashlib.sha256(input_string.encode()).hexdigest()

# Run inference
prediction = model.predict(input_df)[0]

# Hash output
output_hash = hashlib.sha256(str(prediction).encode()).hexdigest()

# Prepare inference record
inference_record = {
    "model_version": MODEL_VERSION,
    "input_data": input_data,
    "input_hash": input_hash,
    "prediction": int(prediction),
    "output_hash": output_hash,
    "timestamp": datetime.now().isoformat()
}

# Load existing logs if present
if os.path.exists(INFERENCE_LOG_PATH):
    with open(INFERENCE_LOG_PATH, "r") as f:
        logs = json.load(f)
else:
    logs = []

# Append new inference record
logs.append(inference_record)

# Save logs
with open(INFERENCE_LOG_PATH, "w") as f:
    json.dump(logs, f, indent=4)

print("✅ Inference executed and logged successfully.")
