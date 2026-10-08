import os
import sys
import json
from datetime import datetime
from typing import Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from hashing.hash_utils import generate_file_hash

FEATURES_PATH = os.path.join(BASE_DIR, "dataset", "git_commits", "features_v1.json")


def verify_payload_and_local_integrity(model_id: str = "git-commit-intelligence", version_id: str = "v2") -> Dict[str, Any]:
    """
    Verifies Remix registration payload and validates local artifact SHA-256 integrity for a specific version.
    """
    version_dir = os.path.join(BASE_DIR, "ai_model", "model_versions", model_id, version_id)
    payload_path = os.path.join(version_dir, "blockchain_registration_payload.json")

    if not os.path.exists(payload_path):
        raise FileNotFoundError(f"Registration payload not found at '{payload_path}'")

    with open(payload_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    dataset_file = os.path.join(BASE_DIR, "dataset", "git_commit_dataset_v2.csv") if version_id == "v2" else FEATURES_PATH
    computed_dataset_hash = generate_file_hash(dataset_file)

    hash_matches = (computed_dataset_hash == payload["dataset_hash"])
    if not hash_matches:
        raise ValueError(f"Dataset hash mismatch! Payload={payload['dataset_hash']}, Computed={computed_dataset_hash}")

    from version_registry import validate_model_version
    val_res = validate_model_version(model_id, version_id)

    return {
        "payload_valid": True,
        "model_id": model_id,
        "version_id": version_id,
        "dataset_hash": computed_dataset_hash,
        "dataset_hash_matches_payload": hash_matches,
        "local_artifact_status": val_res["artifact_integrity"],
        "payload": payload
    }


def record_remix_transaction(
    tx_hash: str,
    block_number: int,
    contract_address: str,
    registered_by: str = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
    model_id: str = "git-commit-intelligence",
    version_id: str = "v2"
) -> Dict[str, Any]:
    """
    Records a verified Remix VM transaction receipt into blockchain_registration.json for specified version.
    """
    version_dir = os.path.join(BASE_DIR, "ai_model", "model_versions", model_id, version_id)
    record_path = os.path.join(version_dir, "blockchain_registration.json")
    dataset_hash = generate_file_hash(FEATURES_PATH)

    rec = {
        "model_id": model_id,
        "version_id": version_id,
        "transaction_hash": tx_hash,
        "block_number": block_number,
        "contract_address": contract_address,
        "registered_by": registered_by,
        "network": "Remix VM (Cancun / In-Memory EVM)",
        "dataset_hash": dataset_hash,
        "registration_timestamp": datetime.now().isoformat()
    }

    with open(record_path, "w", encoding="utf-8") as f:
        json.dump(rec, f, indent=2, ensure_ascii=False)

    print(f"Verified Remix transaction recorded -> {record_path}")
    return rec


if __name__ == "__main__":
    print("==================================================")
    print("REMIX REGISTRATION PAYLOAD & INTEGRITY VERIFICATION (V2)")
    print("==================================================\n")

    res = verify_payload_and_local_integrity("git-commit-intelligence", "v2")
    print(f"Payload Status: Valid (model={res['model_id']}, version={res['version_id']})")
    print(f"Local Artifact Status: {res['local_artifact_status']}")
    print(f"Dataset SHA-256: {res['dataset_hash']}")
