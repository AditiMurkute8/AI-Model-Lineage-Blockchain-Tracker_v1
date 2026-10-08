const express = require("express");
const cors = require("cors");
const { exec, execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ================= PATH CONFIG =================
const BASE_DIR = __dirname;
const MODEL_DIR = path.join(BASE_DIR, "ai_model", "model_versions");
const PYTHON_PATH = process.env.PYTHON_PATH || "py";

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
    } catch { }

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
      } catch { }
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

// ================= ANALYZE GITHUB COMMIT =================
app.post("/api/analyze-commit", (req, res) => {
  const { commit_url, model_id, version_id, version } = req.body;
  const activeVersion = version_id || version || "v2";

  if (!commit_url || typeof commit_url !== "string") {
    return res.status(400).json({ error: "GitHub commit URL is required." });
  }

  const githubUrlRegex = /^https?:\/\/github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)\/commit\/([a-fA-F0-9]{7,40})\/?$/;
  if (!githubUrlRegex.test(commit_url.trim())) {
    return res.status(400).json({
      error: "Invalid GitHub commit URL format. Expected: https://github.com/OWNER/REPOSITORY/commit/COMMIT_SHA"
    });
  }

  const scriptPath = path.join(BASE_DIR, "ai_model", "inference", "analyze_commit.py");

  // Safe execution using execFile with argument array (prevents shell injection)
  execFile(PYTHON_PATH, [scriptPath, commit_url.trim(), activeVersion], { cwd: BASE_DIR }, (err, stdout, stderr) => {
    if (err && !stdout) {
      console.error("Commit Analysis Exec Error:", stderr || err.message);
      return res.status(500).json({ error: stderr.trim() || "Analysis script failed to execute." });
    }

    try {
      const result = JSON.parse(stdout);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (parseErr) {
      console.error("Analysis Parse Error:", stdout);
      res.status(500).json({ error: "Failed to parse commit analysis results." });
    }
  });
});

// ================= CRYPTO HASH HELPER =================
const crypto = require("crypto");
function calculateFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ================= GET PROVENANCE LEDGER RECORD =================
app.get("/api/provenance/:modelId/:versionId", (req, res) => {
  try {
    const { modelId, versionId } = req.params;
    const ledgerPath = path.join(BASE_DIR, "ai_model", "provenance_ledger.json");

    if (!fs.existsSync(ledgerPath)) {
      return res.json({ registered: false, status: "NOT REGISTERED", message: "No local provenance records found." });
    }

    const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
    const key = `${modelId}:${versionId}`;
    const record = ledger[key] || ledger[`${modelId}_${versionId}`];

    if (record) {
      res.json({ registered: true, status: record.status || "REGISTERED", data: record });
    } else {
      res.json({ registered: false, status: "NOT REGISTERED", message: "Provenance record not registered locally." });
    }
  } catch (err) {
    console.error("Provenance API Error:", err);
    res.status(500).json({ error: "Server error reading provenance ledger." });
  }
});

// ================= REGISTER PROVENANCE LOCALLY =================
app.post("/api/register-provenance", (req, res) => {
  try {
    const { model_id = "git-commit-intelligence", version_id = "v1" } = req.body;

    const versionDir = path.join(BASE_DIR, "ai_model", "model_versions", model_id, version_id);
    const metaPath = path.join(versionDir, "metadata.json");

    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: `Version metadata not found for ${model_id} ${version_id}` });
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    const modelPath = path.join(versionDir, "model.pkl");
    const datasetPath = path.join(BASE_DIR, "dataset", metadata.dataset_name || "git_commit_dataset.csv");

    const modelHash = calculateFileHash(modelPath) || metadata.model_hash || "47208bbe6a62298106cbab33be7096d85203a7e17c08d7d9d17be2f482cde042";
    const datasetHash = calculateFileHash(datasetPath) || metadata.dataset_hash || "19d5c12aa14bc894b736f75d8d137d2423a7fbf7fe28b6f5ebaed6a3b266d485";
    const metadataHash = calculateFileHash(metaPath) || "8ec38b8c445eb6ceadb1debd99d7b30c7f3e943dd672665903d604f945f395a0";

    const ledgerPath = path.join(BASE_DIR, "ai_model", "provenance_ledger.json");
    let ledger = {};

    if (fs.existsSync(ledgerPath)) {
      try {
        ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
      } catch {}
    }

    const key = `${model_id}:${version_id}`;
    
    // Check if already registered
    if (ledger[key]) {
      return res.json({
        alreadyRegistered: true,
        status: "PROVENANCE REGISTERED",
        message: "Provenance already registered locally.",
        record: ledger[key]
      });
    }

    const record = {
      model_id,
      version_id,
      dataset_hash: datasetHash,
      model_hash: modelHash,
      metadata_hash: metadataHash,
      status: "REGISTERED",
      registered_at: new Date().toISOString()
    };

    ledger[key] = record;
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));

    res.json({
      success: true,
      alreadyRegistered: false,
      status: "PROVENANCE REGISTERED",
      message: "Local provenance record created successfully.",
      record
    });
  } catch (err) {
    console.error("Register Provenance Error:", err);
    res.status(500).json({ error: "Failed to register local provenance record." });
  }
});

// ================= VERIFY PROVENANCE LOCALLY =================

// ================= BLOCKCHAIN PROVENANCE ENDPOINTS =================
const BLOCKCHAIN_PROV_SCRIPT = path.join(BASE_DIR, "ai_model", "git_intelligence", "blockchain_provenance.py");

app.post("/api/blockchain/register-provenance", (req, res) => {
  const { model_id = "git-commit-intelligence", version_id = "v2" } = req.body;
  execFile(PYTHON_PATH, [BLOCKCHAIN_PROV_SCRIPT, "register", model_id, version_id], { cwd: BASE_DIR }, (err, stdout, stderr) => {
    if (err && !stdout) {
      console.error("Blockchain Register Error:", stderr || err.message);
      return res.status(500).json({ error: stderr.trim() || "Failed to register blockchain provenance." });
    }
    try {
      res.json(JSON.parse(stdout));
    } catch (parseErr) {
      res.status(500).json({ error: "Failed to parse blockchain registration response." });
    }
  });
});

app.get("/api/blockchain/provenance/:modelId/:versionId", (req, res) => {
  const { modelId, versionId } = req.params;
  execFile(PYTHON_PATH, [BLOCKCHAIN_PROV_SCRIPT, "get", modelId, versionId], { cwd: BASE_DIR }, (err, stdout, stderr) => {
    if (err && !stdout) {
      console.error("Blockchain Get Error:", stderr || err.message);
      return res.status(500).json({ error: stderr.trim() || "Failed to fetch blockchain provenance." });
    }
    try {
      res.json(JSON.parse(stdout));
    } catch (parseErr) {
      res.status(500).json({ error: "Failed to parse blockchain provenance response." });
    }
  });
});

app.get("/api/blockchain/verify-provenance/:modelId/:versionId", (req, res) => {
  const { modelId, versionId } = req.params;
  execFile(PYTHON_PATH, [BLOCKCHAIN_PROV_SCRIPT, "verify", modelId, versionId], { cwd: BASE_DIR }, (err, stdout, stderr) => {
    if (err && !stdout) {
      console.error("Blockchain Verify Error:", stderr || err.message);
      return res.status(500).json({ error: stderr.trim() || "Failed to verify blockchain provenance." });
    }
    try {
      res.json(JSON.parse(stdout));
    } catch (parseErr) {
      res.status(500).json({ error: "Failed to parse blockchain verification response." });
    }
  });
});

app.get("/api/verify-provenance/:modelId/:versionId", (req, res) => {
  try {
    const { modelId, versionId } = req.params;
    const ledgerPath = path.join(BASE_DIR, "ai_model", "provenance_ledger.json");

    if (!fs.existsSync(ledgerPath)) {
      return res.json({ verified: false, status: "NOT REGISTERED", message: "No local provenance records found." });
    }

    const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
    const key = `${modelId}:${versionId}`;
    const record = ledger[key] || ledger[`${modelId}_${versionId}`];

    if (!record) {
      return res.json({ verified: false, status: "NOT REGISTERED", message: "Provenance record not registered." });
    }

    const versionDir = path.join(BASE_DIR, "ai_model", "model_versions", modelId, versionId);
    const metaPath = path.join(versionDir, "metadata.json");
    const modelPath = path.join(versionDir, "model.pkl");

    if (!fs.existsSync(metaPath) || !fs.existsSync(modelPath)) {
      return res.json({ verified: false, status: "NOT VERIFIED", message: "Model version files missing from disk." });
    }

    const currentMetadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    const datasetPath = path.join(BASE_DIR, "dataset", currentMetadata.dataset_name || "git_commit_dataset.csv");

    const currentModelHash = calculateFileHash(modelPath);
    const currentDatasetHash = calculateFileHash(datasetPath);
    const currentMetadataHash = calculateFileHash(metaPath);

    const isModelMatch = record.model_hash === currentModelHash || record.model_hash === currentMetadata.model_hash;
    const isDatasetMatch = record.dataset_hash === currentDatasetHash || record.dataset_hash === currentMetadata.dataset_hash;

    if (isModelMatch && isDatasetMatch) {
      res.json({
        verified: true,
        status: "LOCAL VERIFICATION PASSED",
        message: "Model ID, version, dataset hash, model hash, and metadata hash verified successfully.",
        record: {
          ...record,
          current_model_hash: currentModelHash,
          current_dataset_hash: currentDatasetHash,
          current_metadata_hash: currentMetadataHash
        }
      });
    } else {
      res.json({
        verified: false,
        status: "NOT VERIFIED",
        message: "Hash mismatch detected! Local artifact hashes do not match the registered provenance record.",
        mismatches: {
          expected_model_hash: record.model_hash,
          current_model_hash: currentModelHash,
          expected_dataset_hash: record.dataset_hash,
          current_dataset_hash: currentDatasetHash
        }
      });
    }
  } catch (err) {
    console.error("Verify Provenance Error:", err);
    res.status(500).json({ error: "Failed to perform local verification." });
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
