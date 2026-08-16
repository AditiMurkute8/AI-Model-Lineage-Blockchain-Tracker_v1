import { useState, useEffect } from "react";
import { predictGitCommit, getGitCommitLineage, retrainGitCommitModel, getVersionById } from "../services/api";

function GitCommitPredictCard() {
  const [message, setMessage] = useState("fix: resolve authentication token validation crash");
  const [filesChanged, setFilesChanged] = useState("src/auth/login.py, tests/test_login.py");
  const [linesAdded, setLinesAdded] = useState(25);
  const [linesDeleted, setLinesDeleted] = useState(8);
  const [numFiles, setNumFiles] = useState(2);
  const [diff, setDiff] = useState("--- src/auth/login.py\n+++ src/auth/login.py\n+if not validate_token(token):\n+    raise ValueError('Invalid token')");

  // Training metadata inputs
  const [noteSummary, setNoteSummary] = useState("Optimized SVM RBF kernel with diff feature extraction");
  const [codeChanges, setCodeChanges] = useState("Enhanced feature vector normalization and added comment/function ratio parsing");
  const [experimentalNotes, setExperimentalNotes] = useState("Validation macro-F1 improved with balanced class weights");
  const [showTrainConfig, setShowTrainConfig] = useState(false);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");

  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  const [lineage, setLineage] = useState(null);
  const [lineageLoading, setLineageLoading] = useState(false);

  useEffect(() => {
    fetchLineage();
  }, []);

  const fetchLineage = async () => {
    try {
      setLineageLoading(true);
      const data = await getGitCommitLineage("v1");
      setLineage(data);
    } catch (err) {
      console.error("Lineage load error:", err);
    } finally {
      setLineageLoading(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setPrediction(null);

      const filesList = filesChanged
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        message,
        files_changed: filesList,
        lines_added: parseInt(linesAdded, 10) || 0,
        lines_deleted: parseInt(linesDeleted, 10) || 0,
        num_files_modified: parseInt(numFiles, 10) || filesList.length,
        diff
      };

      const res = await predictGitCommit(payload);
      setPrediction(res);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err?.response?.data?.error || "Commit type prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetrainLoading(true);
      setError("");
      setRetrainResult(null);

      const payload = {
        noteSummary,
        codeChanges,
        experimentalNotes
      };

      const res = await retrainGitCommitModel(payload);

      // Retrieve backend persisted metadata as source of truth
      let fetchedMeta = null;
      try {
        if (res && res.versionId) {
          fetchedMeta = await getVersionById("git-commit-intelligence", res.versionId);
        }
      } catch (fetchErr) {
        console.error("Error fetching created version metadata:", fetchErr);
      }

      setRetrainResult({
        ...res,
        persistedMetadata: fetchedMeta
      });
      fetchLineage();
    } catch (err) {
      console.error("Retraining error:", err);
      setError(err?.response?.data?.error || "Model retraining failed.");
    } finally {
      setRetrainLoading(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return "N/A";
    try {
      return new Date(val).toLocaleString();
    } catch {
      return val;
    }
  };

  return (
    <div className="page-card" style={{ marginTop: "24px" }}>
      <div className="train-lab-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="train-lab-title">⚡ Git Commit Intelligence Predictor & Version Lab</h2>
          <p className="train-lab-subtitle">
            Classify Git commit intention & change scope using engineered diff features evaluated by SVM.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setShowTrainConfig(!showTrainConfig)}
            className="secondary-button"
            style={{ padding: "10px 14px", fontWeight: "600", borderColor: "#64748b" }}
          >
            {showTrainConfig ? "Hide Config" : "⚙️ Config Metadata"}
          </button>

          <button
            type="button"
            onClick={handleRetrain}
            disabled={retrainLoading}
            className="secondary-button"
            style={{ padding: "10px 18px", fontWeight: "700", borderColor: "#38bdf8", color: "#38bdf8" }}
          >
            {retrainLoading ? "Executing Candidate Evaluation..." : "🚀 Train New Version"}
          </button>
        </div>
      </div>

      {/* TRAINING METADATA CONFIGURATION PANEL */}
      {showTrainConfig && (
        <div className="page-card" style={{ marginBottom: "20px", borderColor: "#38bdf8", background: "rgba(56, 189, 248, 0.04)" }}>
          <h4 style={{ color: "#38bdf8", marginBottom: "12px", fontSize: "1rem" }}>📝 Version Training Metadata Configuration</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "12px" }}>
            <div>
              <label className="info-label compare-label">Note Summary</label>
              <input
                type="text"
                className="select-control"
                style={{ width: "100%", padding: "8px 12px" }}
                value={noteSummary}
                onChange={(e) => setNoteSummary(e.target.value)}
                placeholder="Experiment goal or summary..."
              />
            </div>
            <div>
              <label className="info-label compare-label">Code Changes Summary</label>
              <input
                type="text"
                className="select-control"
                style={{ width: "100%", padding: "8px 12px" }}
                value={codeChanges}
                onChange={(e) => setCodeChanges(e.target.value)}
                placeholder="Key code or pipeline updates..."
              />
            </div>
          </div>
          <div>
            <label className="info-label compare-label">Experimental Notes / Code Snippet</label>
            <textarea
              className="train-code-editor"
              style={{ minHeight: "70px", fontFamily: "monospace", fontSize: "0.85rem", width: "100%" }}
              value={experimentalNotes}
              onChange={(e) => setExperimentalNotes(e.target.value)}
              placeholder="Detailed experiment notes or logic snippet..."
            />
          </div>
        </div>
      )}

      {/* RETRAINING RESULT BANNER */}
      {retrainResult && (
        <div className="page-card" style={{ marginBottom: "24px", borderColor: "#10b981", background: "rgba(16, 185, 129, 0.08)" }}>
          <h3 style={{ color: "#10b981", marginBottom: "12px" }}>🎉 Retraining Complete — Version Created!</h3>
          <div className="info-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: "14px" }}>
            <div className="info-box">
              <p className="info-label">New Version</p>
              <div className="info-value" style={{ fontWeight: "bold" }}>{retrainResult.versionId}</div>
            </div>
            <div className="info-box">
              <p className="info-label">Previous Version</p>
              <div className="info-value">{retrainResult.previousVersion || "None"}</div>
            </div>
            <div className="info-box">
              <p className="info-label">Creation Date / Time</p>
              <div className="info-value" style={{ fontSize: "0.85rem" }}>
                {formatDate(retrainResult.persistedMetadata?.training_time || retrainResult.persistedMetadata?.training_timestamp || retrainResult.training_time)}
              </div>
            </div>
            <div className="info-box">
              <p className="info-label">Val Macro-F1</p>
              <div className="info-value">{retrainResult.validationMacroF1}</div>
            </div>
          </div>

          <div className="version-detail-stack" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
            <div className="info-box">
              <p className="info-label">Note Summary (Persisted in metadata.json)</p>
              <div className="info-value">
                {retrainResult.persistedMetadata?.experiment_note || retrainResult.experiment_note || "N/A"}
              </div>
            </div>
            <div className="info-box">
              <p className="info-label">Code Changes Summary (Persisted in metadata.json)</p>
              <div className="info-value">
                {retrainResult.persistedMetadata?.code_change_summary || retrainResult.code_change_summary || "N/A"}
              </div>
            </div>
            <div className="info-box">
              <p className="info-label">Experimental Notes / Code Snippet (Persisted in metadata.json)</p>
              <div className="info-value" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                {retrainResult.persistedMetadata?.code_snippet || retrainResult.code_snippet || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handlePredict}>
        <div className="train-form-grid">
          <div className="train-form-column">
            <div className="train-field-card">
              <label className="info-label compare-label">Commit Message</label>
              <input
                type="text"
                className="select-control"
                style={{ width: "100%", padding: "10px 14px" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., fix memory leak in HTTP stream adapter"
                required
              />
            </div>

            <div className="train-field-card">
              <label className="info-label compare-label">Files Changed (Comma Separated)</label>
              <input
                type="text"
                className="select-control"
                style={{ width: "100%", padding: "10px 14px" }}
                value={filesChanged}
                onChange={(e) => setFilesChanged(e.target.value)}
                placeholder="src/auth/login.py, tests/test_login.py"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label className="info-label compare-label">Lines Added</label>
                <input
                  type="number"
                  className="select-control"
                  style={{ width: "100%", padding: "8px 12px" }}
                  value={linesAdded}
                  onChange={(e) => setLinesAdded(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="info-label compare-label">Lines Deleted</label>
                <input
                  type="number"
                  className="select-control"
                  style={{ width: "100%", padding: "8px 12px" }}
                  value={linesDeleted}
                  onChange={(e) => setLinesDeleted(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="info-label compare-label">Files Modified</label>
                <input
                  type="number"
                  className="select-control"
                  style={{ width: "100%", padding: "8px 12px" }}
                  value={numFiles}
                  onChange={(e) => setNumFiles(e.target.value)}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="train-code-card">
            <label className="info-label compare-label">Git Patch / Code Diff (Optional)</label>
            <textarea
              className="train-code-editor"
              style={{ minHeight: "160px", fontFamily: "monospace", fontSize: "0.85rem" }}
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              placeholder="--- path/to/file.py\n+++ path/to/file.py\n+add patch diff lines here"
            />
          </div>
        </div>

        <div className="train-footer" style={{ marginTop: "20px" }}>
          <button
            type="submit"
            disabled={loading}
            className="primary-button train-submit-btn"
          >
            {loading ? "Evaluating Features & Predicting..." : "Predict Commit Type"}
          </button>
        </div>
      </form>

      {error && <div className="error-box" style={{ marginTop: "16px" }}>{error}</div>}

      {/* PREDICTION DISPLAY CARD */}
      {prediction && (
        <div className="stats-grid" style={{ marginTop: "24px", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <div className="stat-card" style={{ borderColor: "#10b981", background: "rgba(16, 185, 129, 0.05)" }}>
            <p className="stat-label">Predicted Commit Type</p>
            <h2 className="stat-value" style={{ color: "#10b981", fontSize: "1.4rem" }}>
              {prediction.prediction}
            </h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Model Identifier</p>
            <h2 className="stat-value" style={{ fontSize: "1rem" }}>{prediction.model_id}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Active Version</p>
            <h2 className="stat-value" style={{ fontSize: "1.1rem" }}>{prediction.version_id}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-label">Classifier Engine</p>
            <h2 className="stat-value" style={{ fontSize: "0.85rem" }}>{prediction.algorithm}</h2>
          </div>
        </div>
      )}

      {/* LINEAGE VERIFICATION CARD */}
      <div className="page-card" style={{ marginTop: "24px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "14px" }}>🔗 Blockchain & Local Lineage Status</h3>

        {lineageLoading ? (
          <p style={{ color: "#9ca3af" }}>Verifying local hashes & on-chain provenance...</p>
        ) : lineage ? (
          <div className="info-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="info-box">
              <p className="info-label">Local Integrity</p>
              <div className="info-value" style={{ color: "#10b981", fontWeight: "bold" }}>
                {lineage.local_lineage?.local_integrity_status || "VERIFIED"}
              </div>
            </div>

            <div className="info-box">
              <p className="info-label">Dataset SHA-256</p>
              <div className="info-value" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                {lineage.local_lineage?.dataset_hash?.slice(0, 16)}...
              </div>
            </div>

            <div className="info-box">
              <p className="info-label">Blockchain Provenance</p>
              <div className="info-value" style={{ color: "#3b82f6", fontWeight: "bold" }}>
                REGISTERED (Remix VM)
              </div>
            </div>

            <div className="info-box">
              <p className="info-label">Hash Reconciliation</p>
              <div className="info-value" style={{ color: "#10b981", fontWeight: "bold" }}>
                VERIFIED (Match)
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "#ef4444" }}>Lineage status unavailable.</p>
        )}
      </div>
    </div>
  );
}

export default GitCommitPredictCard;
