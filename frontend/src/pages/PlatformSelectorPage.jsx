import { useNavigate } from "react-router-dom";

function PlatformSelectorPage() {
  const navigate = useNavigate();

  return (
    <div className="selector-page">
      {/* BACKGROUND GLOW */}
      <div className="selector-bg-glow selector-glow-1"></div>
      <div className="selector-bg-glow selector-glow-2"></div>

      {/* HERO */}
      <div className="selector-hero">
        <div className="selector-badge">AI + Blockchain Model Intelligence Platform</div>

        <h1 className="selector-title">
          Welcome to <span>ChainMind AI</span>
        </h1>

        <p className="selector-subtitle">
          A next-generation platform for exploring intelligent AI model behavior
          and secure blockchain-based version traceability — all in one premium workspace.
        </p>
      </div>

      {/* MAIN SELECTION GRID */}
      <div className="selector-grid">
        {/* AI SECTION */}
        <div className="selector-card ai-card">
          <div className="selector-card-top">
            <div className="selector-icon ai-icon">AI</div>
            <div className="selector-pill">Intelligence Layer</div>
          </div>

          <h2>AI Intelligence Workspace</h2>

          <p>
            Explore model learning, prediction confidence, trust scoring,
            adaptive intelligence, and AI performance evolution across your
            selected ML models.
          </p>

          <div className="selector-features">
            <span>Prediction Insights</span>
            <span>Confidence Analysis</span>
            <span>Trust Scoring</span>
            <span>Learning Evolution</span>
          </div>

          <button onClick={() => navigate("/ai")}>
            Enter AI Workspace →
          </button>
        </div>

        {/* BLOCKCHAIN SECTION */}
        <div className="selector-card blockchain-card">
          <div className="selector-card-top">
            <div className="selector-icon blockchain-icon">BC</div>
            <div className="selector-pill">Integrity Layer</div>
          </div>

          <h2>Blockchain Integrity Workspace</h2>

          <p>
            Track model versions, maintain lineage, compare historical changes,
            and verify tamper-proof model evolution with blockchain-backed
            integrity workflows.
          </p>

          <div className="selector-features">
            <span>Version Tracking</span>
            <span>Lineage History</span>
            <span>Verification Logs</span>
            <span>Immutable Records</span>
          </div>

          <button onClick={() => navigate("/models")}>
            Enter Blockchain Workspace →
          </button>
        </div>
      </div>

      {/* BOTTOM STRIP */}
      <div className="selector-bottom-strip">
        <div className="selector-mini-card">
          <h3>4+</h3>
          <p>Supported AI Models</p>
        </div>

        <div className="selector-mini-card">
          <h3>Dual</h3>
          <p>AI + Blockchain Architecture</p>
        </div>

        <div className="selector-mini-card">
          <h3>Premium</h3>
          <p>Interactive ML Intelligence UI</p>
        </div>
      </div>
    </div>
  );
}

export default PlatformSelectorPage;