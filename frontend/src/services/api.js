import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// =============================
// GET ALL VERSIONS FOR SELECTED MODEL
// =============================
export const getVersions = async (modelId = "logistic-regression") => {
  const response = await API.get(`/versions/${modelId}`);
  return response.data;
};

// =============================
// TRAIN NEW MODEL VERSION
// =============================
export const trainModel = async (modelId = "logistic-regression", payload = {}) => {
  const response = await API.post(`/train/${modelId}`, payload);
  return response.data;
};

// =============================
// GET SINGLE VERSION BY ID
// =============================
export const getVersionById = async (
  modelId = "logistic-regression",
  versionId
) => {
  const response = await API.get(`/version/${modelId}/${versionId}`);
  return response.data;
};

// =============================
// GIT COMMIT INTELLIGENCE PREDICTION
// =============================
export const predictGitCommit = async (payload = {}) => {
  const response = await API.post("/predict/git-commit-intelligence", payload);
  return response.data;
};

// =============================
// GIT COMMIT INTELLIGENCE RETRAINING
// =============================
export const retrainGitCommitModel = async (payload = {}) => {
  const response = await API.post("/train/git-commit-intelligence", payload);
  return response.data;
};

// =============================
// GIT COMMIT INTELLIGENCE LINEAGE
// =============================
export const getGitCommitLineage = async (versionId = "v1") => {
  const response = await API.get(`/lineage/git-commit-intelligence/${versionId}`);
  return response.data;
};

// =============================
// ANALYZE GITHUB COMMIT
// =============================
export const analyzeCommit = async (
  commitUrl,
  modelId = "git-commit-intelligence"
) => {
  const response = await API.post("/api/analyze-commit", {
    commit_url: commitUrl,
    model_id: modelId,
  });
  return response.data;
};

// =============================
// PROVENANCE LEDGER API
// =============================
export const getProvenanceRecord = async (
  modelId = "git-commit-intelligence",
  versionId = "v1"
) => {
  const response = await API.get(`/api/provenance/${modelId}/${versionId}`);
  return response.data;
};

export const registerProvenanceLocal = async (
  modelId = "git-commit-intelligence",
  versionId = "v1"
) => {
  const response = await API.post("/api/register-provenance", {
    model_id: modelId,
    version_id: versionId,
  });
  return response.data;
};

export const verifyProvenanceLocal = async (
  modelId = "git-commit-intelligence",
  versionId = "v1"
) => {
  const response = await API.get(`/api/verify-provenance/${modelId}/${versionId}`);
  return response.data;
};

export default API;

// =============================
// BLOCKCHAIN PROVENANCE API
// =============================
export const getBlockchainProvenance = async (
  modelId = "git-commit-intelligence",
  versionId = "v2"
) => {
  const response = await API.get(`/api/blockchain/provenance/${modelId}/${versionId}`);
  return response.data;
};

export const registerBlockchainProvenance = async (
  modelId = "git-commit-intelligence",
  versionId = "v2"
) => {
  const response = await API.post("/api/blockchain/register-provenance", {
    model_id: modelId,
    version_id: versionId,
  });
  return response.data;
};

export const verifyBlockchainProvenance = async (
  modelId = "git-commit-intelligence",
  versionId = "v2"
) => {
  const response = await API.get(`/api/blockchain/verify-provenance/${modelId}/${versionId}`);
  return response.data;
};
