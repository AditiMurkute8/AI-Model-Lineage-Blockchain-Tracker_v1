import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

export const getVersions = async () => {
  const response = await api.get("/versions");
  return response.data;
};

export const trainModel = async (payload) => {
  const response = await api.post("/train", payload);
  return response.data;
};

export default api;