const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ================= PATH CONFIG =================
const BASE_DIR = __dirname;
const MODEL_DIR = path.join(BASE_DIR, "ai_model", "model_versions");
const PYTHON_PATH = "python";

// ================= HELPER =================
const getModelPath = (modelId) => {
  return path.join(MODEL_DIR, modelId);
};

// ================= TRAIN MODEL =================
app.post("/train/:modelId", (req, res) => {
  const { modelId } = req.params;

  const { experiment_note, code_change_summary, code_snippet } = req.body;

  const payload = {
    model_id: modelId,
    experiment_note: experiment_note || "",
    code_change_summary: code_change_summary || "",
    code_snippet: code_snippet || "",
  };

  const tempJsonPath = path.join(BASE_DIR, "temp_experiment.json");
  fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2));

  const command = `${PYTHON_PATH} "${path.join(
    BASE_DIR,
    "ai_model",
    "train_model.py"
  )}"`;

  exec(command, { cwd: BASE_DIR }, (err, stdout, stderr) => {
    try {
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
    } catch {}

    if (err) {
      console.error("Training Error:", err);
      console.error(stderr);
      return res.status(500).json({ error: "Training failed" });
    }

    console.log(stdout);

    res.json({
      message: `${modelId} model trained successfully`,
      output: stdout,
    });
  });
});

// ================= GET VERSIONS =================
app.get("/versions/:modelId", (req, res) => {
  try {
    const { modelId } = req.params;
    const modelPath = getModelPath(modelId);

    if (!fs.existsSync(modelPath)) {
      return res.json([]);
    }

    const versions = fs
      .readdirSync(modelPath)
      .filter((v) => v.startsWith("v"))
      .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

    const result = [];

    for (const v of versions) {
      const metaPath = path.join(modelPath, v, "metadata.json");

      if (!fs.existsSync(metaPath)) continue;

      try {
        const data = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        result.push(data);
      } catch {}
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= GET SINGLE VERSION =================
app.get("/version/:modelId/:versionId", (req, res) => {
  try {
    const { modelId, versionId } = req.params;

    const metaPath = path.join(
      MODEL_DIR,
      modelId,
      versionId,
      "metadata.json"
    );

    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: "Version not found" });
    }

    const data = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("Backend running");
});

// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});