import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { MODEL_META } from "../utils/modelMeta";

function AIModelsPage() {
  const navigate = useNavigate();
  const models = Object.values(MODEL_META);

  const getAICapability = (modelId) => {
    switch (modelId) {
      case "logistic-regression":
        return {
          summary: "Fast classification intelligence for structured prediction tasks.",
          chips: ["Confidence Score", "Binary Prediction", "Decision Trends", "Feature Influence"],
        };
      case "decision-tree":
        return {
          summary: "Explainable decision logic with interpretable branch reasoning.",
          chips: ["Decision Paths", "Explainability", "Rule Extraction", "Prediction Logic"],
        };
      case "random-forest":
        return {
          summary: "Ensemble-based intelligence with stronger stability and predictive depth.",
          chips: ["Ensemble Voting", "Trust Score", "Variance Control", "Robust Prediction"],
        };
      case "svm":
        return {
          summary: "Boundary-based learning for high-separation intelligent classification.",
          chips: ["Margin Analysis", "Boundary Confidence", "Class Separation", "Prediction Strength"],
        };
      case "git-commit-intelligence":
        return {
          summary: "Git Commit classification engine trained on engineered code-change diff features.",
          chips: ["Commit Classifier", "41 Diff Features", "SVM RBF Kernel", "Blockchain Provenance"],
        };
      default:

        return {
          summary: "Smart insights, predictive monitoring, and model intelligence.",
          chips: ["AI Insights", "Trust Score", "Drift Detection", "Predictions"],
        };
    }
  };

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="ai-models-hero">
        <div className="ai-models-hero-badge">AI Intelligence Layer</div>

        <PageHeader
          title="AI Model Intelligence Hub"
          subtitle="Explore model cognition, prediction confidence, trust behavior, and intelligent performance signals across all supported AI systems."
        />

        <div className="ai-models-hero-stats">
          <div className="ai-models-hero-stat">
            <h3>{models.length}</h3>
            <p>Active AI Models</p>
          </div>

          <div className="ai-models-hero-stat">
            <h3>Live</h3>
            <p>Intelligence Monitoring</p>
          </div>

          <div className="ai-models-hero-stat">
            <h3>Adaptive</h3>
            <p>Behavior Tracking</p>
          </div>

          <div className="ai-models-hero-stat">
            <h3>Explainable</h3>
            <p>Decision Understanding</p>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="section-header" style={{ marginTop: "16px" }}>
        <h2 className="section-title">AI Model Workspaces</h2>

        <div
          className="section-button"
          style={{ pointerEvents: "none", opacity: 0.85 }}
        >
          {models.length} Intelligence Modules
        </div>
      </div>

      {/* AI MODEL GRID */}
      <div className="ai-model-grid">
        {models.map((model, index) => {
          const aiData = getAICapability(model.id);

          return (
            <div
              key={model.id}
              className="ai-model-card"
              onClick={() => navigate(`/ai/${model.id}/dashboard`)}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="ai-model-card-top">
                <div className="ai-model-icon">{model.shortName}</div>
                <div className="ai-model-badge">AI Powered</div>
              </div>

              <div className="ai-model-content">
                <h2 className="ai-model-title">{model.name}</h2>
                <p className="ai-model-category">{model.category}</p>
                <p className="ai-model-description">{aiData.summary}</p>
              </div>

              <div className="ai-model-features">
                {aiData.chips.map((chip, idx) => (
                  <span key={idx}>{chip}</span>
                ))}
              </div>

              <div className="ai-model-footer">
                <button
                  className="ai-model-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ai/${model.id}/dashboard`);
                  }}
                >
                  Open AI Workspace →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM INFO STRIP */}
      <div className="ai-showcase-strip">
        <div className="ai-showcase-card">
          <p className="ai-showcase-label">Why AI matters</p>
          <h3>Every model should be understandable, not just usable</h3>
          <p>
            This intelligence layer helps you inspect confidence, behavioral
            shifts, trustworthiness, and decision quality beyond just raw output.
          </p>
        </div>

        <div className="ai-showcase-card">
          <p className="ai-showcase-label">AI Engineering View</p>
          <h3>Built like a real intelligent model monitoring system</h3>
          <p>
            This workspace simulates how modern AI platforms evaluate prediction
            quality, explainability, and adaptive performance in production-ready systems.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIModelsPage;