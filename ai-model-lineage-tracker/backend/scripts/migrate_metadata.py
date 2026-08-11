import os
import json
import hashlib

# ================= PATH =================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "ai_model", "model_versions")
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "dataset_v2.csv")

# ================= HASH FUNCTION =================
def generate_dataset_hash(file_path):
    if not os.path.exists(file_path):
        return None

    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)

    return sha256.hexdigest()

# ================= MIGRATION =================
def migrate_metadata():
    if not os.path.exists(MODEL_DIR):
        print("❌ model_versions folder not found.")
        return

    dataset_name = os.path.basename(DATASET_PATH)
    dataset_hash = generate_dataset_hash(DATASET_PATH)

    if not dataset_hash:
        print("❌ Dataset file not found. Cannot generate hash.")
        return

    updated_count = 0
    skipped_count = 0

    print("🚀 Starting metadata migration...\n")

    for model_id in os.listdir(MODEL_DIR):
        model_path = os.path.join(MODEL_DIR, model_id)

        if not os.path.isdir(model_path):
            continue

        for version_id in os.listdir(model_path):
            version_path = os.path.join(model_path, version_id)

            if not os.path.isdir(version_path):
                continue

            metadata_file = os.path.join(version_path, "metadata.json")

            if not os.path.exists(metadata_file):
                print(f"⚠️ Missing metadata.json in {model_id}/{version_id}")
                skipped_count += 1
                continue

            try:
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)

                changed = False

                # Add dataset_name if missing
                if "dataset_name" not in metadata or not metadata["dataset_name"]:
                    metadata["dataset_name"] = dataset_name
                    changed = True

                # Add dataset_hash if missing
                if "dataset_hash" not in metadata or not metadata["dataset_hash"]:
                    metadata["dataset_hash"] = dataset_hash
                    changed = True

                if changed:
                    with open(metadata_file, "w") as f:
                        json.dump(metadata, f, indent=4)

                    print(f"✅ Updated: {model_id}/{version_id}")
                    updated_count += 1
                else:
                    print(f"⏭️ Already OK: {model_id}/{version_id}")
                    skipped_count += 1

            except Exception as e:
                print(f"❌ Error in {model_id}/{version_id}: {e}")
                skipped_count += 1

    print("\n🎉 Migration Complete!")
    print(f"Updated: {updated_count}")
    print(f"Skipped: {skipped_count}")

# ================= RUN =================
if __name__ == "__main__":
    migrate_metadata()