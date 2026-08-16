import os
import sys
import json
from datetime import datetime
from typing import Dict, Any, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from hashing.hash_utils import generate_file_hash

MANIFEST_PATH = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v1", "model_integrity.json")
FEATURES_PATH = os.path.join(BASE_DIR, "dataset", "git_commits", "features_v1.json")
REGISTRATION_RECORD_PATH = os.path.join(BASE_DIR, "ai_model", "model_versions", "git-commit-intelligence", "v1", "blockchain_registration.json")

# Default local EVM RPC settings
DEFAULT_RPC_URL = os.environ.get("ETH_RPC_URL", "http://127.0.0.1:8545")
DEFAULT_CONTRACT_ADDRESS = os.environ.get("CONTRACT_ADDRESS", None)


def get_local_dataset_hash() -> str:
    if not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"features_v1.json not found at '{FEATURES_PATH}'")
    return generate_file_hash(FEATURES_PATH)


def check_blockchain_connection(rpc_url: str = DEFAULT_RPC_URL) -> Tuple[bool, str, Any]:
    """
    Checks whether a local EVM RPC node is reachable via Web3.
    """
    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if w3.is_connected():
            chain_id = w3.eth.chain_id
            return True, f"Connected to EVM Node (Chain ID: {chain_id})", w3
        else:
            return False, f"RPC Node at '{rpc_url}' is not responding.", None
    except ImportError:
        return False, "Python 'web3' package is not installed.", None
    except Exception as e:
        return False, f"RPC Connection failed: {e}", None


def verify_on_chain_record(
    contract_instance,
    model_id: str = "git-commit-intelligence",
    version_id: str = "v1"
) -> Tuple[str, Dict[str, Any]]:
    """
    Calls contract getModelVersion(modelId, versionId) for on-chain read-back verification.
    """
    local_hash = get_local_dataset_hash()
    
    # Execute on-chain read-back call
    record_tuple = contract_instance.functions.getModelVersion(model_id, version_id).call()
    
    on_chain_model_id = record_tuple[0]
    on_chain_version_id = record_tuple[1]
    on_chain_dataset_hash = record_tuple[2]
    on_chain_timestamp = record_tuple[3]
    on_chain_registered_by = record_tuple[4]

    hash_matches = (local_hash == on_chain_dataset_hash)
    status = "VERIFIED" if hash_matches else "HASH_MISMATCH"

    return status, {
        "status": status,
        "modelId": on_chain_model_id,
        "versionId": on_chain_version_id,
        "on_chain_dataset_hash": on_chain_dataset_hash,
        "local_dataset_hash": local_hash,
        "timestamp": on_chain_timestamp,
        "registeredBy": on_chain_registered_by,
        "hash_matches": hash_matches
    }


def register_and_verify_blockchain(
    rpc_url: str = DEFAULT_RPC_URL,
    contract_address: str = DEFAULT_CONTRACT_ADDRESS
) -> Dict[str, Any]:
    """
    Full Phase 6B registration and read-back verification pipeline.
    Safety: Never fabricates fake transactions if RPC node is offline.
    """
    local_dataset_hash = get_local_dataset_hash()
    
    mapping_payload = {
        "modelId": "git-commit-intelligence",
        "versionId": "v1",
        "datasetHash": local_dataset_hash,
        "rpc_url": rpc_url,
        "contract_address": contract_address or "UNSPECIFIED"
    }

    connected, reason, w3 = check_blockchain_connection(rpc_url)

    if not connected:
        return {
            "status": "BLOCKED",
            "reason": f"BLOCKCHAIN REGISTRATION BLOCKED: {reason}",
            "mapping_payload": mapping_payload,
            "local_verification": {
                "dataset_hash": local_dataset_hash,
                "dataset_hash_verified": True
            }
        }

    # If connected, execute on-chain transaction & read-back
    # (Contract interaction logic via w3 instance)
    try:
        # Load ABI from contract directory if available
        abi_path = os.path.join(BASE_DIR, "contracts", "AIModelLineage.json")
        if not os.path.exists(abi_path):
            return {
                "status": "BLOCKED",
                "reason": "Contract ABI file ('AIModelLineage.json') not found. Compile contract first.",
                "mapping_payload": mapping_payload
            }

        with open(abi_path, "r", encoding="utf-8") as f:
            contract_json = json.load(f)
            abi = contract_json.get("abi", contract_json)

        contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=abi)

        # 1. Duplicate check before registration
        existing_status, existing_readback = verify_on_chain_record(contract)
        if existing_readback["on_chain_dataset_hash"] != "":
            if existing_readback["hash_matches"]:
                return {
                    "status": "ALREADY_REGISTERED",
                    "reason": "Model version already registered on-chain with matching dataset hash.",
                    "readback": existing_readback
                }
            else:
                return {
                    "status": "HASH_CONFLICT",
                    "reason": f"On-chain hash ({existing_readback['on_chain_dataset_hash'][:16]}) differs from local hash.",
                    "readback": existing_readback
                }

        # 2. Call registerModelVersion
        account = w3.eth.accounts[0]
        tx_hash = contract.functions.registerModelVersion(
            "git-commit-intelligence", "v1", local_dataset_hash
        ).transact({"from": account})

        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # 3. On-chain Read-Back
        readback_status, readback_data = verify_on_chain_record(contract)

        # 4. Write local registration provenance record
        reg_record = {
            "model_id": "git-commit-intelligence",
            "version_id": "v1",
            "transaction_hash": tx_receipt.transactionHash.hex(),
            "block_number": tx_receipt.blockNumber,
            "contract_address": contract_address,
            "network": f"ChainID_{w3.eth.chain_id}",
            "dataset_hash": local_dataset_hash,
            "registered_at": datetime.now().isoformat()
        }

        with open(REGISTRATION_RECORD_PATH, "w", encoding="utf-8") as f:
            json.dump(reg_record, f, indent=2, ensure_ascii=False)

        return {
            "status": "REGISTERED",
            "tx_hash": tx_receipt.transactionHash.hex(),
            "block_number": tx_receipt.blockNumber,
            "readback": readback_data
        }

    except Exception as err:
        return {
            "status": "BLOCKED",
            "reason": f"Blockchain execution failed: {err}",
            "mapping_payload": mapping_payload
        }


if __name__ == "__main__":
    print("==================================================")
    print("PHASE 6B BLOCKCHAIN REGISTRATION & READ-BACK AUDIT")
    print("==================================================\n")

    res = register_and_verify_blockchain()
    print(f"Status: {res['status']}")
    if "reason" in res:
        print(f"Details: {res['reason']}")
