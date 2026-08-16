const express = require("express");
const cors = require("cors");
const { exec, execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ================= PATH & SECURITY CONFIG =================
const BASE_DIR = __dirname;
const MODEL_DIR = path.join(BASE_DIR, "ai_model", "model_versions");
const PYTHON_PATH = "python";
const VERSION_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// ================= HELPER =================
const getModelPath = (modelId) => {
  return path.join(MODEL_DIR, modelId);
};

// ================= GIT COMMIT PREDICTION ENDPOINT =================
app.post("/predict/git-commit-intelligence", (req, res) => {
  try {
    const payload = req.body || {};
    const tempJsonPath = path.join(BASE_DIR, `temp_predict_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2));

    const predictScript = path.join(BASE_DIR, "ai_model", "git_intelligence", "predict.py");

    execFile(PYTHON_PATH, [predictScript, tempJsonPath], { cwd: BASE_DIR }, (err, stdout, stderr) => {
      try {
        if (fs.existsSync(tempJsonPath)) {
          fs.unlinkSync(tempJsonPath);
        }
      } catch {}

      if (err) {
        console.error("Prediction Process Error:", err);
        return res.status(500).json({ error: "Prediction process failed" });
      }

      try {
        const result = JSON.parse(stdout.trim());
        res.json(result);
      } catch (parseErr) {
        console.error("Prediction Output Parse Error");
        res.status(500).json({ error: "Invalid prediction output" });
      }
    });
  } catch (err) {
    console.error("Predict Request Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= GIT COMMIT LINEAGE HANDLER & ENDPOINTS =================
const handleGitCommitLineage = (req, res) => {
  try {
    const versionId = req.params.versionId || "v1";

    // Security Audit F-01 Fix: Sanitize & Validate versionId parameter
    if (!VERSION_ID_REGEX.test(versionId)) {
      return res.status(400).json({ success: false, error: "Invalid version ID" });
    }

    // Security Audit F-02 Fix: Use execFile with array arguments instead of shell string interpolation
    const pyScriptCode = `import sys, json; sys.path.insert(0, sys.argv[1]); from ai_model.git_intelligence.lineage import verify_model_lineage; print(json.dumps(verify_model_lineage('git-commit-intelligence', sys.argv[2])))`;

    execFile(
      PYTHON_PATH,
      ["-c", pyScriptCode, BASE_DIR.replace(/\\/g, "/"), versionId],
      { cwd: BASE_DIR },
      (err, stdout, stderr) => {
        if (err) {
          console.error("Lineage Execution Error:", err);
          return res.status(500).json({ error: "Lineage verification failed" });
        }

        try {
          const lineageData = JSON.parse(stdout.trim());
          res.json(lineageData);
        } catch (parseErr) {
          res.status(500).json({ error: "Invalid lineage JSON output" });
        }
      }
    );
  } catch (err) {
    console.error("Lineage Endpoint Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.get("/lineage/git-commit-intelligence", handleGitCommitLineage);
app.get("/lineage/git-commit-intelligence/:versionId", handleGitCommitLineage);

// ================= RETRAIN GIT COMMIT INTELLIGENCE MODEL (V2+) =================
app.post("/train/git-commit-intelligence", (req, res) => {
  try {
    const {
      noteSummary,
      codeChanges,
      experimentalNotes,
      experiment_note,
      code_change_summary,
      code_snippet
    } = req.body || {};

    const note = noteSummary || experiment_note || "";
    const changes = codeChanges || code_change_summary || "";
    const expNotes = experimentalNotes || code_snippet || "";

    const retrainScript = path.join(BASE_DIR, "ai_model", "git_intelligence", "retrain.py");

    const args = [
      retrainScript,
      "--model-id", "git-commit-intelligence",
      "--note-summary", note,
      "--code-changes", changes,
      "--experimental-notes", expNotes
    ];

    execFile(
      PYTHON_PATH,
      args,
      { cwd: BASE_DIR },
      (err, stdout, stderr) => {
        if (err) {
          console.error("Retraining Error:", err);
          return res.status(500).json({ error: "Retraining process failed" });
        }

        try {
          const retrainResult = JSON.parse(stdout.trim());
          res.json(retrainResult);
        } catch (parseErr) {
          console.error("Retrain Output Parse Error:", stdout);
          res.status(500).json({ error: "Invalid retraining JSON output" });
        }
      }
    );
  } catch (err) {
    console.error("Retrain Request Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= TRAIN MODEL (V1 LEGACY) =================
app.post("/train/:modelId", (req, res) => {
  const { modelId } = req.params;

  const { experiment_note, code_change_summary, code_snippet } = req.body;

  const payload = {
    model_id: modelId,
    experiment_note: experiment_note || "",
    code_change_summary: code_change_summary || "",
    code_snippet: code_snippet || "",
  };

  const tempJsonPath = path.join(BASE_DIR, `temp_exp_${Date.now()}.json`);
  fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2));

  const trainScript = path.join(BASE_DIR, "ai_model", "train_model.py");

  execFile(PYTHON_PATH, [trainScript], { cwd: BASE_DIR }, (err, stdout, stderr) => {
    try {
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
    } catch {}

    if (err) {
      console.error("Training Error:", err);
      return res.status(500).json({ error: "Training failed" });
    }

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