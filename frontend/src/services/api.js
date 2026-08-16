import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

// =============================
// GET ALL VERSIONS FOR SELECTED MODEL
// =============================
export const getVersions = async (modelId = "logistic-regression") => {
  const response = await API.get(`/versions/${modelId}`);
  return response.data;
};

// =============================
// TRAIN NEW MODEL VERSION (LEGACY V1)
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
// GIT COMMIT INTELLIGENCE PREDICTION (V2)
// =============================
export const predictGitCommit = async (payload = {}) => {
  const response = await API.post("/predict/git-commit-intelligence", payload);
  return response.data;
};

// =============================
// GIT COMMIT INTELLIGENCE RETRAINING (PHASE 9)
// =============================
export const retrainGitCommitModel = async (payload = {}) => {
  const response = await API.post("/train/git-commit-intelligence", payload);
  return response.data;
};

// =============================
// GIT COMMIT INTELLIGENCE LINEAGE (V2)
// =============================
export const getGitCommitLineage = async (versionId = "v1") => {
  const response = await API.get(`/lineage/git-commit-intelligence/${versionId}`);
  return response.data;
};

export default API;