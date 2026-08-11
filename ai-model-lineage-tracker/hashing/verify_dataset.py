import json
import os
from hashing.hash_utils import generate_file_hash

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Change these to test different versions
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "dataset_v2.csv")
METADATA_PATH = os.path.join(
    BASE_DIR,
    "ai_model",
    "model_versions",
    "v3",
    "metadata.json"
)

# Load stored metadata
with open(METADATA_PATH, "r") as f:
    metadata = json.load(f)

stored_hash = metadata["dataset_hash"]

# Recompute dataset hash
current_hash = generate_file_hash(DATASET_PATH)

print("Stored Dataset Hash   :", stored_hash)
print("Current Dataset Hash  :", current_hash)

# Verify integrity
if stored_hash == current_hash:
    print("✅ Dataset Integrity Verified")
else:
    print("❌ Dataset Integrity Violated")
