import { useState } from "react";
import { trainModel } from "../services/api";
import { useParams, useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { getModelMeta } from "../utils/modelMeta";

function TrainPage() {
  const { modelId = "logistic-regression" } = useParams();
  const location = useLocation();
  const model = getModelMeta(modelId);

  const isAI = location.pathname.startsWith("/ai");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [experimentNote, setExperimentNote] = useState("");
  const [codeChangeSummary, setCodeChangeSummary] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");

  const [runIntent, setRunIntent] = useState(
    isAI ? "Adaptive Optimization" : "Performance Upgrade"
  );
  const [riskProfile, setRiskProfile] = useState("Moderate");
  const [trackingMode, setTrackingMode] = useState(
    isAI ? "Intelligence Evolution" : "Immutable Version Tracking"
  );

  // NEW AI-SPECIFIC STATE
  const [thinkingStyle, setThinkingStyle] = useState("Analytical Reasoning");
  const [confidenceStrategy, setConfidenceStrategy] = useState("Balanced");
  const [learningMode, setLearningMode] = useState("Adaptive Fine-Tuning");

  const handleTrain = async () => {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const payload = {
        experiment_note: experimentNote.trim() || "No notes",
        code_change_summary: codeChangeSummary.trim() || "No changes",
        code_snippet: codeSnippet.trim() || "N/A",

        // Optional extra metadata (very useful if backend supports it)
        run_intent: runIntent,
        risk_profile: riskProfile,
        tracking_mode: trackingMode,
        ...(isAI && {
          thinking_style: thinkingStyle,
          confidence_strategy: confidenceStrategy,
          learning_mode: learningMode,
        }),
      };

      const result = await trainModel(modelId, payload);

      setMessage(
        result?.message ||
          `${
            isAI
              ? `${model.name} intelligence run completed successfully.`
              : `${model.name} new version trained successfully.`
          }`
      );

      setExperimentNote("");
      setCodeChangeSummary("");
      setCodeSnippet("");
    } catch (err) {
      console.error("Training error:", err);
      setError(
        err?.response?.data?.error ||
          `${
            isAI
              ? `Intelligence training failed for ${model.name}. Check backend.`
              : `Training failed for ${model.name}. Check backend.`
          }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Training Engine" : model.badge}
        </div>

        <PageHeader
          title={`${isAI ? "Train Intelligence •" : "Train"} ${model.name}`}
          subtitle={
            isAI
              ? `Launch a new ${model.name} intelligence cycle and generate an adaptive learning state inside your AI workspace.`
              : `Launch a new ${model.name} training run and generate a fresh tracked version inside your blockchain-backed workspace.`
          }
        />
      </div>

      {/* STATUS */}
      <div className="train-status-wrapper">
        <span className="train-status-pill">
          <span className="train-status-dot" />
          {isAI ? "AI Training System Ready" : "Version Training System Ready"}
        </span>
      </div>

      {/* SUMMARY */}
      <div className="model-summary-card">
        <div className="model-summary-item">
          <p className="model-summary-label">Selected Model</p>
          <h3 className="model-summary-value">{model.name}</h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">Category</p>
          <h3 className="model-summary-value">{model.category}</h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">Training Mode</p>
          <h3 className="model-summary-value">
            {isAI ? "Adaptive Intelligence Run" : "Versioned Experiment Run"}
          </h3>
        </div>
      </div>

      {/* RUN CONFIG SNAPSHOT */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">{isAI ? "Run Intent" : "Run Objective"}</p>
          <h2 className="stat-value">{runIntent}</h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">{isAI ? "Risk Profile" : "Change Risk"}</p>
          <h2 className="stat-value">{riskProfile}</h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Evolution Layer" : "Tracking Layer"}
          </p>
          <h2 className="stat-value">{trackingMode}</h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">Expected Output</p>
          <h2 className="stat-value">
            {isAI ? "New Intelligence State" : "New Version Entry"}
          </h2>
        </div>
      </div>

      {/* ================= AI INTELLIGENCE DESIGN PANEL ================= */}
      {isAI && (
        <div className="page-card" style={{ marginTop: "24px" }}>
          <div className="train-lab-header" style={{ marginBottom: "18px" }}>
            <div>
              <h2 className="train-lab-title">🧠 Intelligence Design Panel</h2>
              <p className="train-lab-subtitle">
                Shape how this intelligence run should think, learn, and express
                confidence before training begins.
              </p>
            </div>
          </div>

          <div className="compare-select-grid">
            <div>
              <label className="info-label compare-label">Thinking Style</label>
              <select
                className="select-control"
                value={thinkingStyle}
                onChange={(e) => setThinkingStyle(e.target.value)}
              >
                <option>Analytical Reasoning</option>
                <option>Fast Approximation</option>
                <option>Balanced Decision Making</option>
                <option>Exploratory Learning</option>
              </select>
            </div>

            <div>
              <label className="info-label compare-label">
                Confidence Strategy
              </label>
              <select
                className="select-control"
                value={confidenceStrategy}
                onChange={(e) => setConfidenceStrategy(e.target.value)}
              >
                <option>Aggressive (High Confidence)</option>
                <option>Balanced</option>
                <option>Conservative (Safer Predictions)</option>
              </select>
            </div>

            <div>
              <label className="info-label compare-label">Learning Mode</label>
              <select
                className="select-control"
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value)}
              >
                <option>Incremental Learning</option>
                <option>Full Retraining</option>
                <option>Adaptive Fine-Tuning</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI PREVIEW ================= */}
      {isAI && (
        <div className="info-grid" style={{ marginTop: "24px" }}>
          <div className="info-box">
            <p className="info-label">Expected Behavior</p>
            <div className="info-value">
              {runIntent === "Confidence Improvement"
                ? "Higher prediction confidence with tighter decision boundaries"
                : runIntent === "Behavior Refinement"
                ? "Improved decision consistency and smoother output behavior"
                : runIntent === "Trust Calibration"
                ? "More calibrated trust scoring across uncertain predictions"
                : "Balanced adaptive intelligence improvement"}
            </div>
          </div>

          <div className="info-box">
            <p className="info-label">Risk Impact</p>
            <div className="info-value">
              {riskProfile === "High"
                ? "May produce larger behavior shifts and temporary instability"
                : riskProfile === "Low"
                ? "Safe but slower evolution with lower experimentation risk"
                : "Moderate controlled evolution with manageable variance"}
            </div>
          </div>

          <div className="info-box">
            <p className="info-label">Intelligence Type</p>
            <div className="info-value">
              {trackingMode.includes("Trust")
                ? "Trust-Aware Intelligence"
                : trackingMode.includes("Behavior")
                ? "Behavior-Driven Intelligence"
                : trackingMode.includes("Memory")
                ? "Memory-Augmented Intelligence"
                : "General Adaptive Intelligence"}
            </div>
          </div>

          <div className="info-box">
            <p className="info-label">Training Prediction</p>
            <div className="info-value">
              {getTrainingPrediction(
                runIntent,
                riskProfile,
                confidenceStrategy,
                learningMode
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRAINING LAB */}
      <div className="train-lab-card page-card" style={{ marginTop: "24px" }}>
        <div className="train-lab-header">
          <div>
            <h2 className="train-lab-title">
              {isAI
                ? `Start a New ${model.name} Intelligence Run`
                : `Start a New ${model.name} Training Run`}
            </h2>

            <p className="train-lab-subtitle">
              {isAI
                ? "Configure learning intent, adaptive behavior notes, and logic updates to generate a smarter intelligence state."
                : "Configure your experiment inputs, attach implementation notes, and trigger a new versioned training cycle from your workspace."}
            </p>
          </div>
        </div>

        {/* CONTROL PANEL */}
        <div className="compare-select-grid" style={{ marginBottom: "24px" }}>
          <div>
            <label className="info-label compare-label">
              {isAI ? "Run Intent" : "Run Objective"}
            </label>
            <select
              className="select-control"
              value={runIntent}
              onChange={(e) => setRunIntent(e.target.value)}
            >
              {isAI ? (
                <>
                  <option>Adaptive Optimization</option>
                  <option>Confidence Improvement</option>
                  <option>Trust Calibration</option>
                  <option>Behavior Refinement</option>
                </>
              ) : (
                <>
                  <option>Performance Upgrade</option>
                  <option>Feature Engineering</option>
                  <option>Pipeline Optimization</option>
                  <option>Version Enhancement</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="info-label compare-label">
              {isAI ? "Risk Profile" : "Change Risk"}
            </label>
            <select
              className="select-control"
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value)}
            >
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label className="info-label compare-label">
              {isAI ? "Evolution Layer" : "Tracking Layer"}
            </label>
            <select
              className="select-control"
              value={trackingMode}
              onChange={(e) => setTrackingMode(e.target.value)}
            >
              {isAI ? (
                <>
                  <option>Intelligence Evolution</option>
                  <option>Adaptive Learning Memory</option>
                  <option>Behavior Shift Analysis</option>
                  <option>Trust-Aware Refinement</option>
                </>
              ) : (
                <>
                  <option>Immutable Version Tracking</option>
                  <option>Lineage Registration</option>
                  <option>Audit-Safe Recording</option>
                  <option>Blockchain Traceability</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="train-form-grid">
          {/* LEFT SIDE */}
          <div className="train-form-column">
            <div className="train-field-card">
              <div className="train-field-header">
                <h3 className="train-field-title">
                  {isAI ? "Learning Note" : "Experiment Note"}
                </h3>
                <p className="train-field-helper">
                  {isAI
                    ? "Describe what intelligence behavior or capability you want this run to improve."
                    : "Describe the purpose or intent behind this training run."}
                </p>
              </div>

              <textarea
                className="textarea-control train-textarea"
                placeholder={
                  isAI
                    ? "Example: Improve trust stability and reduce uncertainty across prediction boundaries..."
                    : "Example: Tested improved feature selection and adjusted dataset balancing strategy..."
                }
                value={experimentNote}
                onChange={(e) => setExperimentNote(e.target.value)}
              />
            </div>

            <div className="train-field-card">
              <div className="train-field-header">
                <h3 className="train-field-title">
                  {isAI ? "Behavior Change Summary" : "Code Change Summary"}
                </h3>
                <p className="train-field-helper">
                  {isAI
                    ? "Mention updates made to behavior logic, confidence handling, or trust flow."
                    : "Mention updates made to training logic, preprocessing, or parameters."}
                </p>
              </div>

              <textarea
                className="textarea-control"
                placeholder={
                  isAI
                    ? "Example: Adjusted confidence thresholds, improved trust scoring logic, and refined decision pathway..."
                    : "Example: Added feature scaling, tuned max_iter, and updated preprocessing pipeline..."
                }
                value={codeChangeSummary}
                onChange={(e) => setCodeChangeSummary(e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="train-code-card">
            <div className="train-code-shell">
              <div className="train-code-topbar">
                <span className="code-dot red"></span>
                <span className="code-dot yellow"></span>
                <span className="code-dot green"></span>
                <span className="train-code-label">
                  {isAI
                    ? `${model.shortName}_intelligence.py`
                    : `${model.shortName}_training.py`}
                </span>
              </div>

              <textarea
                className="train-code-editor"
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder={
                  isAI
                    ? `# ${model.name} intelligence refinement
model.fit(X, y)
# trust logic updated
# confidence thresholds adjusted
# adaptive behavior refinement`
                    : `# ${model.name} training pipeline
model.fit(X, y)
# tuned parameters
# updated experiment logic`
                }
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="train-footer">
          <div className="train-footer-note">
            <p>
              {isAI
                ? "This action will generate a new intelligence state with tracked learning notes, behavioral evolution, trust-related metrics, and adaptive history."
                : "This action will create a new tracked version with associated metrics, experiment notes, lineage references, and immutable model history."}
            </p>
          </div>

          <button
            onClick={handleTrain}
            disabled={loading}
            className="primary-button train-submit-btn"
          >
            {loading
              ? isAI
                ? `Training ${model.shortName} Intelligence...`
                : `Training ${model.shortName}...`
              : isAI
              ? `Train ${model.shortName} Intelligence`
              : `Train ${model.shortName} Model`}
          </button>
        </div>

        {/* FEEDBACK */}
        {message && <div className="success-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}

function getTrainingPrediction(
  intent,
  risk,
  confidenceStrategy,
  learningMode
) {
  if (
    intent === "Confidence Improvement" &&
    risk === "High" &&
    confidenceStrategy.includes("Aggressive")
  ) {
    return "Confidence likely to increase sharply, but recall may become less stable.";
  }

  if (
    intent === "Behavior Refinement" &&
    learningMode === "Adaptive Fine-Tuning"
  ) {
    return "Decision consistency and behavioral smoothness are likely to improve.";
  }

  if (
    intent === "Trust Calibration" &&
    confidenceStrategy.includes("Conservative")
  ) {
    return "Predictions may become safer, more explainable, and trust-aware.";
  }

  if (learningMode === "Full Retraining" && risk === "High") {
    return "This run may cause major intelligence shifts with broader behavioral changes.";
  }

  if (risk === "Low") {
    return "Slow but stable improvement is expected with low behavioral volatility.";
  }

  return "Balanced metric and intelligence improvement is expected.";
}

export default TrainPage;