import React, { useState, useEffect } from "react";
import {
  analyzeCommit,
  predictGitCommit,
  getProvenanceRecord,
  registerProvenanceLocal,
  verifyProvenanceLocal,
  getBlockchainProvenance,
  registerBlockchainProvenance,
  verifyBlockchainProvenance
} from "../services/api";

function GitCommitPredictCard() {
  const [commitUrl, setCommitUrl] = useState("https://github.com/expressjs/express/commit/6340c1eaaedc0ddcae8be8df2cdb1d2e961cbf2f");
  const [selectedVersion, setSelectedVersion] = useState("v2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Form inputs for manual feature prediction
  const [message, setMessage] = useState("");
  const [filesChanged, setFilesChanged] = useState("");
  const [linesAdded, setLinesAdded] = useState(0);
  const [linesDeleted, setLinesDeleted] = useState(0);
  const [numFiles, setNumFiles] = useState(1);
  const [diff, setDiff] = useState("");
  const [prediction, setPrediction] = useState(null);

  // Local Provenance State
  const [provStatus, setProvStatus] = useState("NOT_REGISTERED");
  const [provLoading, setProvLoading] = useState(false);
  const [provMessage, setProvMessage] = useState("");
  const [provError, setProvError] = useState(null);
  const [provDetails, setProvDetails] = useState(null);

  // Blockchain Provenance State
  const [bcStatus, setBcStatus] = useState("NOT REGISTERED");
  const [bcLoading, setBcLoading] = useState(false);
  const [bcMessage, setBcMessage] = useState("");
  const [bcError, setBcError] = useState(null);
  const [bcDetails, setBcDetails] = useState(null);

  const fetchProvenanceStatus = async (version) => {
    try {
      // Local check
      const resLocal = await getProvenanceRecord("git-commit-intelligence", version);
      if (resLocal && resLocal.registered) {
        setProvStatus(resLocal.status === "LOCAL VERIFICATION PASSED" ? "VERIFIED" : "REGISTERED");
        setProvDetails(resLocal.data);
      } else {
        setProvStatus("NOT_REGISTERED");
        setProvDetails(null);
      }
    } catch (e) {
      setProvStatus("NOT_REGISTERED");
    }

    try {
      // Blockchain check
      const resBc = await getBlockchainProvenance("git-commit-intelligence", version);
      if (resBc && resBc.registered) {
        setBcStatus(resBc.status || "REGISTERED");
        setBcDetails(resBc.data);
      } else {
        setBcStatus("NOT REGISTERED");
        setBcDetails(null);
      }
    } catch (e) {
      setBcStatus("NOT REGISTERED");
    }
  };

  useEffect(() => {
    fetchProvenanceStatus(selectedVersion);
  }, [selectedVersion]);

  const handleUrlAnalyze = async (e) => {
    e.preventDefault();
    if (!commitUrl.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const data = await analyzeCommit(commitUrl.trim(), "git-commit-intelligence", selectedVersion);
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysisResult(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze commit URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualPredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    const parsedFiles = filesChanged.split(",").map(s => s.trim()).filter(Boolean);

    try {
      const data = await predictGitCommit({
        message,
        files_changed: parsedFiles.length > 0 ? parsedFiles : ["modified_file.py"],
        lines_added: parseInt(linesAdded, 10) || 0,
        lines_deleted: parseInt(linesDeleted, 10) || 0,
        num_files_modified: parseInt(numFiles, 10) || 1,
        diff,
        version_id: selectedVersion
      });
      setPrediction(data);
    } catch (err) {
      setError(err.response?.data?.error || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterLocalProvenance = async () => {
    setProvLoading(true);
    setProvError(null);
    setProvMessage("");
    try {
      const res = await registerProvenanceLocal("git-commit-intelligence", selectedVersion);
      if (res.error) {
        setProvError(res.error);
      } else {
        setProvStatus("REGISTERED");
        setProvMessage(res.message || "Local provenance registered successfully.");
        setProvDetails(res.record);
      }
    } catch (err) {
      setProvError(err.response?.data?.error || "Failed to register local provenance.");
    } finally {
      setProvLoading(false);
    }
  };

  const handleVerifyLocalProvenance = async () => {
    setProvLoading(true);
    setProvError(null);
    setProvMessage("");
    try {
      const res = await verifyProvenanceLocal("git-commit-intelligence", selectedVersion);
      if (res.verified) {
        setProvStatus("VERIFIED");
        setProvMessage(res.message || "Local verification passed!");
        setProvDetails(res.record);
      } else {
        setProvStatus("NOT_VERIFIED");
        setProvError(res.message || "Local verification failed.");
      }
    } catch (err) {
      setProvError(err.response?.data?.error || "Failed to verify local provenance.");
    } finally {
      setProvLoading(false);
    }
  };

  const handleRegisterBlockchainProvenance = async () => {
    setBcLoading(true);
    setBcError(null);
    setBcMessage("");
    try {
      const res = await registerBlockchainProvenance("git-commit-intelligence", selectedVersion);
      if (res.error) {
        setBcError(res.error);
      } else {
        setBcStatus("REGISTERED");
        setBcMessage(res.message || "Blockchain provenance registered successfully.");
        setBcDetails(res.record);
      }
    } catch (err) {
      setBcError(err.response?.data?.error || "Failed to register on blockchain.");
    } finally {
      setBcLoading(false);
    }
  };

  const handleVerifyBlockchainProvenance = async () => {
    setBcLoading(true);
    setBcError(null);
    setBcMessage("");
    try {
      const res = await verifyBlockchainProvenance("git-commit-intelligence", selectedVersion);
      if (res.verified) {
        setBcStatus("VERIFIED");
        setBcMessage(res.message || "On-chain verification passed!");
        setBcDetails(res.data);
      } else {
        setBcStatus("HASH_MISMATCH");
        setBcError(res.message || "Blockchain verification failed.");
      }
    } catch (err) {
      setBcError(err.response?.data?.error || "Failed to verify on blockchain.");
    } finally {
      setBcLoading(false);
    }
  };

  const datasetHashDisplay = selectedVersion === "v2" 
    ? "5fdcc497843ade2c161fce80d06a777924348525d4beefad1014a68f9bebea20"
    : "19d5c12aa14bc894b736f75d8d137d2423a7fbf7fe28b6f5ebaed6a3b266d485";

  const modelHashDisplay = selectedVersion === "v2"
    ? "a7068781c80a73d6df14058bfef7e2f11c766d8ad758c30f147ef7eb45776d42"
    : "47208bbe6a62298106cbab33be7096d85203a7e17c08d7d9d17be2f482cde042";

  return (
    <div className="train-form-card" style={{ maxWidth: "100%", margin: "0 auto" }}>
      {/* VERSION SELECTOR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        padding: "16px 20px",
        borderRadius: "8px",
        border: "1px solid var(--border-color, #334155)",
        marginBottom: "24px"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc" }}>Git Commit Intelligence Version Lab</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
            Select active model architecture for commit risk evaluation & provenance tracking
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ fontSize: "0.9rem", color: "#e2e8f0", fontWeight: "600" }}>Model Version:</label>
          <select
            className="select-control"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: "600",
              backgroundColor: "#0f172a",
              color: "#38bdf8",
              borderColor: "#0284c7"
            }}
          >
            <option value="v2">v2 — Active (22 Structural Features)</option>
            <option value="v1">v1 — Legacy (15 Features)</option>
          </select>
        </div>
      </div>

      {/* TOP SECTION: GITHUB COMMIT URL ANALYZER */}
      <div style={{
        padding: "20px",
        borderRadius: "8px",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        border: "1px solid var(--border-color, #334155)",
        marginBottom: "24px"
      }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#38bdf8", fontSize: "1rem" }}>
          GitHub Commit URL Intelligence Analyzer
        </h4>

        <form onSubmit={handleUrlAnalyze} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="url"
            className="select-control"
            style={{ flex: 1, padding: "10px 14px", fontSize: "0.9rem" }}
            value={commitUrl}
            onChange={(e) => setCommitUrl(e.target.value)}
            placeholder="https://github.com/OWNER/REPO/commit/SHA"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="primary-button"
            style={{ padding: "10px 20px", whiteSpace: "nowrap" }}
          >
            {loading ? "Analyzing..." : "Analyze GitHub Commit"}
          </button>
        </form>

        {error && <div className="error-box" style={{ marginTop: "16px" }}>{error}</div>}

        {analysisResult && (
          <div style={{ marginTop: "20px" }}>
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <div className="stat-card" style={{ borderColor: "#10b981", background: "rgba(16, 185, 129, 0.08)" }}>
                <p className="stat-label">Predicted Type</p>
                <h2 className="stat-value" style={{ color: "#10b981", fontSize: "1.3rem" }}>
                  {analysisResult.analysis?.commit_type}
                </h2>
              </div>

              <div className="stat-card">
                <p className="stat-label">Model Version</p>
                <h2 className="stat-value" style={{ color: "#38bdf8", fontSize: "1.1rem" }}>
                  {analysisResult.model_info?.version_id}
                </h2>
              </div>

              <div className="stat-card">
                <p className="stat-label">Risk Level</p>
                <h2 className="stat-value" style={{
                  color: analysisResult.analysis?.risk_level === "HIGH" ? "#ef4444" : analysisResult.analysis?.risk_level === "MEDIUM" ? "#f59e0b" : "#10b981",
                  fontSize: "1.1rem"
                }}>
                  {analysisResult.analysis?.risk_level}
                </h2>
              </div>

              <div className="stat-card">
                <p className="stat-label">Confidence</p>
                <h2 className="stat-value" style={{ fontSize: "1.1rem" }}>
                  {analysisResult.analysis?.confidence}%
                </h2>
              </div>
            </div>

            <div style={{ marginTop: "16px", padding: "14px", backgroundColor: "#0f172a", borderRadius: "6px", border: "1px solid #334155", fontSize: "0.85rem", color: "#cbd5e1" }}>
              <div><strong>Repository:</strong> {analysisResult.repository} | <strong>Author:</strong> {analysisResult.author}</div>
              <div style={{ marginTop: "4px" }}><strong>Commit Message:</strong> <em>{analysisResult.commit_message}</em></div>
              <div style={{ marginTop: "4px" }}><strong>Stats:</strong> {analysisResult.stats?.files_changed} files changed, +{analysisResult.stats?.lines_added} / -{analysisResult.stats?.lines_deleted} lines</div>
            </div>
          </div>
        )}
      </div>

      {/* PROVENANCE SUBSECTIONS GRID (LOCAL & BLOCKCHAIN) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* LEFT CARD: LOCAL PROVENANCE */}
        <div style={{
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          border: "1px solid var(--border-color, #334155)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "15px", color: "#f8fafc" }}>LOCAL PROVENANCE</h4>
            <span style={{
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              backgroundColor: provStatus === "VERIFIED" ? "#10b981" : provStatus === "REGISTERED" ? "#3b82f6" : "#64748b",
              color: "#ffffff"
            }}>
              {provStatus === "VERIFIED" ? "VERIFIED" : provStatus === "REGISTERED" ? "REGISTERED" : "NOT REGISTERED"}
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <div><strong style={{ color: "#94a3b8" }}>Model:</strong> git-commit-intelligence</div>
            <div><strong style={{ color: "#94a3b8" }}>Version:</strong> {selectedVersion}</div>
            <div><strong style={{ color: "#94a3b8" }}>Dataset Hash:</strong> <code style={{ fontSize: "10px" }}>{datasetHashDisplay.slice(0, 16)}...</code></div>
            <div><strong style={{ color: "#94a3b8" }}>Model Hash:</strong> <code style={{ fontSize: "10px" }}>{modelHashDisplay.slice(0, 16)}...</code></div>
          </div>

          {provMessage && <p style={{ fontSize: "11px", color: "#38bdf8", marginBottom: "10px" }}>{provMessage}</p>}
          {provError && <p style={{ fontSize: "11px", color: "#f87171", marginBottom: "10px" }}>{provError}</p>}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleRegisterLocalProvenance}
              disabled={provLoading}
              className="section-button"
              style={{ padding: "8px 14px", fontSize: "12px" }}
            >
              {provLoading ? "Processing..." : "Register Local"}
            </button>
            <button
              type="button"
              onClick={handleVerifyLocalProvenance}
              disabled={provLoading}
              className="section-button"
              style={{ padding: "8px 14px", fontSize: "12px" }}
            >
              {provLoading ? "Processing..." : "Verify Local"}
            </button>
          </div>
        </div>

        {/* RIGHT CARD: BLOCKCHAIN PROVENANCE */}
        <div style={{
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          border: "1px solid #0284c7"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "15px", color: "#38bdf8" }}>BLOCKCHAIN PROVENANCE</h4>
            <span style={{
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              backgroundColor: bcStatus === "VERIFIED" ? "#10b981" : bcStatus === "REGISTERED" ? "#3b82f6" : "#64748b",
              color: "#ffffff"
            }}>
              {bcStatus}
            </span>
          </div>

          <div style={{ fontSize: "12px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <div><strong style={{ color: "#94a3b8" }}>Model:</strong> git-commit-intelligence</div>
            <div><strong style={{ color: "#94a3b8" }}>Version:</strong> {selectedVersion}</div>
            <div><strong style={{ color: "#94a3b8" }}>Dataset Hash:</strong> <code style={{ fontSize: "10px" }}>{datasetHashDisplay}</code></div>
            <div><strong style={{ color: "#94a3b8" }}>Model Hash:</strong> <code style={{ fontSize: "10px" }}>{modelHashDisplay}</code></div>
            {bcDetails?.transaction_hash && (
              <div><strong style={{ color: "#94a3b8" }}>Tx Hash:</strong> <code style={{ fontSize: "10px", color: "#38bdf8" }}>{bcDetails.transaction_hash.slice(0, 18)}...</code></div>
            )}
            {bcDetails?.contract_address && (
              <div><strong style={{ color: "#94a3b8" }}>Contract:</strong> <code style={{ fontSize: "10px" }}>{bcDetails.contract_address}</code></div>
            )}
          </div>

          {bcMessage && <p style={{ fontSize: "11px", color: "#38bdf8", marginBottom: "10px" }}>{bcMessage}</p>}
          {bcError && <p style={{ fontSize: "11px", color: "#f87171", marginBottom: "10px" }}>{bcError}</p>}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleRegisterBlockchainProvenance}
              disabled={bcLoading}
              className="primary-button"
              style={{ padding: "8px 14px", fontSize: "12px", backgroundColor: "#0284c7" }}
            >
              {bcLoading ? "Executing Tx..." : "Register On Blockchain"}
            </button>
            <button
              type="button"
              onClick={handleVerifyBlockchainProvenance}
              disabled={bcLoading}
              className="primary-button"
              style={{ padding: "8px 14px", fontSize: "12px", backgroundColor: "#059669" }}
            >
              {bcLoading ? "Verifying..." : "Verify On Blockchain"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GitCommitPredictCard;
