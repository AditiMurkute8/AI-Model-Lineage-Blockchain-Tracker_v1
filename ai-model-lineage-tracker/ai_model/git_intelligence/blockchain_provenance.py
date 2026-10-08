import os
import sys
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Tuple

from web3 import Web3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEPLOY_INFO_PATH = os.path.join(BASE_DIR, "contracts", "AIModelLineage.json")
DEFAULT_RPC_URL = os.environ.get("ETH_RPC_URL", "http://127.0.0.1:8545")

def get_hash(file_path: str) -> str:
    if not os.path.exists(file_path):
        return ""
    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def get_hardhat_connection() -> Tuple[bool, str, Any, str, list]:
    if not os.path.exists(DEPLOY_INFO_PATH):
        return False, "Contracts JSON metadata missing. Run deploy_to_hardhat.py first.", None, "", []

    try:
        with open(DEPLOY_INFO_PATH, "r", encoding="utf-8") as f:
            deploy_info = json.load(f)
            contract_address = deploy_info["contract_address"]
            abi = deploy_info["abi"]
    except Exception as e:
        return False, f"Failed to load contract deployment metadata: {e}", None, "", []

    try:
        w3 = Web3(Web3.HTTPProvider(DEFAULT_RPC_URL, request_kwargs={"timeout": 3}))
        if not w3.is_connected():
            return False, f"Hardhat node on '{DEFAULT_RPC_URL}' is not connected.", None, contract_address, abi
        return True, f"Connected to Hardhat Node (Chain ID: {w3.eth.chain_id})", w3, contract_address, abi
    except Exception as e:
        return False, f"RPC Connection Failed: {e}", None, contract_address, abi

def register_blockchain_provenance(model_id: str = "git-commit-intelligence", version_id: str = "v2") -> Dict[str, Any]:
    connected, reason, w3, contract_address, abi = get_hardhat_connection()
    if not connected:
        return {
            "success": False,
            "status": "BLOCKCHAIN NOT AVAILABLE",
            "reason": reason,
            "contract_address": contract_address or "UNSPECIFIED"
        }

    account = w3.eth.accounts[0]
    version_dir = os.path.join(BASE_DIR, "ai_model", "model_versions", model_id, version_id)
    metadata_path = os.path.join(version_dir, "metadata.json")
    model_path = os.path.join(version_dir, "model.pkl")

    if not os.path.exists(metadata_path) or not os.path.exists(model_path):
        return {"success": False, "error": f"Model files missing for {model_id}/{version_id}"}

    with open(metadata_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    dataset_name = meta.get("dataset_name", "git_commit_dataset_v2.csv" if version_id == "v2" else "git_commit_dataset.csv")
    dataset_path = os.path.join(BASE_DIR, "dataset", dataset_name)

    model_hash = get_hash(model_path)
    dataset_hash = get_hash(dataset_path)

    contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=abi)

    # Check if already registered on-chain
    existing = contract.functions.getModelProvenance(model_id, version_id).call()
    if existing[0] and existing[2] == dataset_hash and existing[3] == model_hash:
        return {
            "success": True,
            "alreadyRegistered": True,
            "status": "BLOCKCHAIN REGISTERED",
            "message": "Model provenance already registered on smart contract with identical hashes.",
            "record": {
                "model_id": model_id,
                "version_id": version_id,
                "dataset_hash": dataset_hash,
                "model_hash": model_hash,
                "contract_address": contract_address,
                "network": "Hardhat Local",
                "chain_id": w3.eth.chain_id,
                "sender": account,
                "registered_by": existing[5],
                "on_chain_timestamp": existing[4]
            }
        }

    # Execute actual transaction on Hardhat EVM node
    tx_hash = contract.functions.registerModelProvenance(
        model_id,
        version_id,
        dataset_hash,
        model_hash
    ).transact({"from": account})

    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    readback = contract.functions.getModelProvenance(model_id, version_id).call()

    return {
        "success": True,
        "alreadyRegistered": False,
        "status": "BLOCKCHAIN REGISTERED",
        "message": "Model provenance successfully registered on Hardhat smart contract.",
        "record": {
            "model_id": model_id,
            "version_id": version_id,
            "dataset_hash": dataset_hash,
            "model_hash": model_hash,
            "transaction_hash": tx_receipt.transactionHash.hex(),
            "block_number": tx_receipt.blockNumber,
            "contract_address": contract_address,
            "network": "Hardhat Local",
            "chain_id": w3.eth.chain_id,
            "sender": account,
            "registered_by": readback[5],
            "on_chain_timestamp": readback[4]
        }
    }

def get_blockchain_provenance(model_id: str = "git-commit-intelligence", version_id: str = "v2") -> Dict[str, Any]:
    connected, reason, w3, contract_address, abi = get_hardhat_connection()
    if not connected:
        return {
            "registered": False,
            "status": "BLOCKCHAIN NOT AVAILABLE",
            "message": reason,
            "contract_address": contract_address or "UNSPECIFIED"
        }

    contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=abi)
    rec = contract.functions.getModelProvenance(model_id, version_id).call()

    if not rec[0] or rec[2] == "":
        return {
            "registered": False,
            "status": "NOT REGISTERED",
            "message": f"No on-chain provenance record found for {model_id}/{version_id}."
        }

    return {
        "registered": True,
        "status": "BLOCKCHAIN REGISTERED",
        "data": {
            "model_id": rec[0],
            "version_id": rec[1],
            "dataset_hash": rec[2],
            "model_hash": rec[3],
            "on_chain_timestamp": rec[4],
            "registered_by": rec[5],
            "contract_address": contract_address,
            "network": "Hardhat Local",
            "chain_id": w3.eth.chain_id
        }
    }

def verify_blockchain_provenance(model_id: str = "git-commit-intelligence", version_id: str = "v2") -> Dict[str, Any]:
    connected, reason, w3, contract_address, abi = get_hardhat_connection()
    if not connected:
        return {
            "verified": False,
            "status": "BLOCKCHAIN NOT AVAILABLE",
            "message": reason,
            "contract_address": contract_address or "UNSPECIFIED"
        }

    version_dir = os.path.join(BASE_DIR, "ai_model", "model_versions", model_id, version_id)
    metadata_path = os.path.join(version_dir, "metadata.json")
    model_path = os.path.join(version_dir, "model.pkl")

    if not os.path.exists(metadata_path) or not os.path.exists(model_path):
        return {"verified": False, "status": "NOT VERIFIED", "message": "Local model files missing from disk."}

    with open(metadata_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    dataset_name = meta.get("dataset_name", "git_commit_dataset_v2.csv" if version_id == "v2" else "git_commit_dataset.csv")
    dataset_path = os.path.join(BASE_DIR, "dataset", dataset_name)

    local_model_hash = get_hash(model_path)
    local_dataset_hash = get_hash(dataset_path)

    contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=abi)
    rec = contract.functions.getModelProvenance(model_id, version_id).call()

    on_chain_model_id = rec[0]
    on_chain_dataset_hash = rec[2]
    on_chain_model_hash = rec[3]

    if not on_chain_model_id or on_chain_dataset_hash == "":
        return {
            "verified": False,
            "status": "NOT REGISTERED",
            "message": f"Provenance record not registered on contract {contract_address}."
        }

    is_model_match = (on_chain_model_hash == local_model_hash)
    is_dataset_match = (on_chain_dataset_hash == local_dataset_hash)

    if is_model_match and is_dataset_match:
        return {
            "verified": True,
            "status": "BLOCKCHAIN VERIFICATION PASSED",
            "message": "ON-CHAIN BLOCKCHAIN VERIFICATION PASSED: Contract record matches local v2 artifacts 100%.",
            "data": {
                "model_id": model_id,
                "version_id": version_id,
                "on_chain_dataset_hash": on_chain_dataset_hash,
                "on_chain_model_hash": on_chain_model_hash,
                "local_dataset_hash": local_dataset_hash,
                "local_model_hash": local_model_hash,
                "contract_address": contract_address,
                "network": "Hardhat Local",
                "chain_id": w3.eth.chain_id,
                "registered_by": rec[5],
                "on_chain_timestamp": rec[4]
            }
        }
    else:
        return {
            "verified": False,
            "status": "HASH_MISMATCH",
            "message": "Blockchain verification failed: On-chain hash does not match local disk hash.",
            "mismatches": {
                "on_chain_dataset_hash": on_chain_dataset_hash,
                "local_dataset_hash": local_dataset_hash,
                "on_chain_model_hash": on_chain_model_hash,
                "local_model_hash": local_model_hash
            }
        }

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "register"
    m_id = sys.argv[2] if len(sys.argv) > 2 else "git-commit-intelligence"
    v_id = sys.argv[3] if len(sys.argv) > 3 else "v2"

    if cmd == "register":
        res = register_blockchain_provenance(m_id, v_id)
    elif cmd == "get":
        res = get_blockchain_provenance(m_id, v_id)
    elif cmd == "verify":
        res = verify_blockchain_provenance(m_id, v_id)
    else:
        res = {"error": f"Unknown command {cmd}"}

    print(json.dumps(res, indent=2))
