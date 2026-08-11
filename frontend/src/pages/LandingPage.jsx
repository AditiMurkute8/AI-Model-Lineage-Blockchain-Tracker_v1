import { useNavigate } from "react-router-dom";
import { MODEL_META } from "../utils/modelMeta";

function LandingPage() {
  const navigate = useNavigate();
  const models = Object.values(MODEL_META);

  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-hero-left">
          <div className="landing-hero-badge">AI Model Lineage Platform</div>

          <h1 className="landing-title">
            Track, Compare & Verify
            <br />
            <span>AI Model Evolution</span>
          </h1>

          <p className="landing-subtitle">
            A structured machine learning version-control workspace built for
            training history, experiment intelligence, lineage tracking,
            analytics, and integrity verification.
          </p>

          <div className="landing-buttons">
            <button
              className="landing-primary-btn"
              onClick={() => navigate("/models")}
            >
              Explore Models
            </button>

            <button
              className="landing-secondary-btn"
              onClick={() => navigate("/models/logistic-regression/dashboard")}
            >
              Open Demo Workspace
            </button>
          </div>

          <div className="landing-mini-stats">
            <div className="landing-stat-box">
              <h3>4+</h3>
              <p>Supported ML Models</p>
            </div>

            <div className="landing-stat-box">
              <h3>Versioned</h3>
              <p>Experiment Lifecycle Tracking</p>
            </div>

            <div className="landing-stat-box">
              <h3>Verified</h3>
              <p>Integrity Validation Layer</p>
            </div>
          </div>
        </div>

        <div className="landing-hero-right">
          <div className="hero-main-card">
            <p className="hero-label">PROJECT OVERVIEW</p>
            <h3>Model Intelligence Workspace</h3>
            <p>
              Centralized dashboards for experiment management, version history,
              training metadata, analytics, and model integrity validation.
            </p>
          </div>

          <div className="hero-floating-card top-card">
            <span>Best Accuracy</span>
            <h4>v38</h4>
          </div>

          <div className="hero-floating-card bottom-card">
            <span>Latest Verified</span>
            <h4>v55</h4>
          </div>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section className="landing-section">
        <div className="landing-section-header">
          <p className="landing-section-tag">Core Features</p>
          <h2>Everything your AI workflow needs</h2>
          <p>
            Built like a lightweight ML engineering platform for structured
            experimentation and model lifecycle management.
          </p>
        </div>

        <div className="landing-feature-grid">
          <FeatureCard
            title="Dashboard Intelligence"
            description="View total versions, recent activity, best-performing models, and workspace-level summaries."
          />
          <FeatureCard
            title="Model Lineage"
            description="Understand how every version evolved through previous links, metadata flow, and experiment continuity."
          />
          <FeatureCard
            title="Version Comparison"
            description="Compare two versions side-by-side using performance metrics, notes, and training context."
          />
          <FeatureCard
            title="Analytics"
            description="Track trends in accuracy, precision, and recall across the full lifecycle of your model."
          />
          <FeatureCard
            title="Training Workspace"
            description="Launch new training runs with tracked experiment notes, code changes, and version creation."
          />
          <FeatureCard
            title="Blockchain Verification"
            description="Validate integrity using lineage continuity, metadata completeness, and dataset consistency."
          />
        </div>
      </section>

      {/* MODELS PREVIEW */}
      <section className="landing-section">
        <div className="landing-section-header">
          <p className="landing-section-tag">Supported Models</p>
          <h2>Dedicated workspaces for each algorithm</h2>
          <p>
            Each machine learning model gets its own dashboard, version history,
            analytics, comparison tools, and training workflow.
          </p>
        </div>

        <div className="landing-model-grid">
          {models.map((model) => (
            <div
              key={model.id}
              className="landing-model-card"
              onClick={() => navigate(`/models/${model.id}/dashboard`)}
            >
              <div className="landing-model-icon">{model.shortName}</div>

              <div className="landing-model-content">
                <h3>{model.name}</h3>
                <p>{model.category}</p>
                <span>{model.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="landing-cta">
        <div className="landing-cta-box">
          <p className="landing-section-tag">Project Showcase</p>
          <h2>Built like an ML product, not just a college project</h2>
          <p>
            This platform combines machine learning, version control, analytics,
            lineage intelligence, and verification into one structured
            engineering system.
          </p>

          <button
            className="landing-primary-btn"
            onClick={() => navigate("/models")}
          >
            Launch Platform
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="landing-feature-card">
      <div className="feature-card-line" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default LandingPage;