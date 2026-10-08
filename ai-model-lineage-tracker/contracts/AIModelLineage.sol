// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AIModelLineage {

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    struct ModelVersion {
        string modelId;
        string versionId;
        string datasetHash;
        string modelHash;
        uint256 timestamp;
        address registeredBy;
    }

    struct InferenceRecord {
        string modelVersion;
        string inputHash;
        string outputHash;
        uint256 timestamp;
    }

    mapping(string => ModelVersion) private modelVersions;
    mapping(uint256 => InferenceRecord) private inferenceRecords;

    uint256 public inferenceCount = 0;

    function registerModelProvenance(
        string memory modelId,
        string memory versionId,
        string memory datasetHash,
        string memory modelHash
    ) public {
        string memory modelKey = string(
            abi.encodePacked(modelId, "_", versionId)
        );

        modelVersions[modelKey] = ModelVersion(
            modelId,
            versionId,
            datasetHash,
            modelHash,
            block.timestamp,
            msg.sender
        );
    }

    function getModelProvenance(
        string memory modelId,
        string memory versionId
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            address
        )
    {
        string memory modelKey = string(
            abi.encodePacked(modelId, "_", versionId)
        );

        ModelVersion memory mv = modelVersions[modelKey];

        return (
            mv.modelId,
            mv.versionId,
            mv.datasetHash,
            mv.modelHash,
            mv.timestamp,
            mv.registeredBy
        );
    }

    function registerModelVersion(
        string memory modelId,
        string memory versionId,
        string memory datasetHash
    ) public {
        registerModelProvenance(modelId, versionId, datasetHash, "");
    }

    function getModelVersion(
        string memory modelId,
        string memory versionId
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            address
        )
    {
        string memory modelKey = string(
            abi.encodePacked(modelId, "_", versionId)
        );

        ModelVersion memory mv = modelVersions[modelKey];

        return (
            mv.modelId,
            mv.versionId,
            mv.datasetHash,
            mv.timestamp,
            mv.registeredBy
        );
    }

    function registerInference(
        string memory modelVersion,
        string memory inputHash,
        string memory outputHash
    ) public {
        inferenceRecords[inferenceCount] = InferenceRecord(
            modelVersion,
            inputHash,
            outputHash,
            block.timestamp
        );

        inferenceCount++;
    }

    function getInferenceRecord(uint256 inferenceId)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256
        )
    {
        InferenceRecord memory ir = inferenceRecords[inferenceId];

        return (
            ir.modelVersion,
            ir.inputHash,
            ir.outputHash,
            ir.timestamp
        );
    }
}
