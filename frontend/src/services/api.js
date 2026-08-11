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

export default API;