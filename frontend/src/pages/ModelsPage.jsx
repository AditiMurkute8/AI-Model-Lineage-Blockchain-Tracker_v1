import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { MODEL_META } from "../utils/modelMeta";

function ModelsPage() {
  const navigate = useNavigate();
  const models = Object.values(MODEL_META);

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="models-hero">
        <div className="models-hero-badge">Blockchain in Integrity Layer</div>

        <PageHeader
          title="Blockchain Model Registry"
          subtitle="Track model versions, verify integrity, monitor lineage, and ensure tamper-proof AI lifecycle management."
        />

        <div className="models-hero-stats">
          <div className="models-hero-stat">
            <h3>{models.length}</h3>
            <p>Supported Models</p>
          </div>

          <div className="models-hero-stat">
            <h3>Versioned</h3>
            <p>Experiment Tracking</p>
          </div>

          <div className="models-hero-stat">
            <h3>Interactive</h3>
            <p>ML Workspaces</p>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="section-header" style={{ marginTop: "16px" }}>
        <h2 className="section-title">Registered Models on Blockchain</h2>
        <div
          className="section-button"
          style={{ pointerEvents: "none", opacity: 0.85 }}
        >
          {models.length} Workspaces
        </div>
      </div>

      {/* MODEL GRID */}
      <div className="premium-model-grid">
        {models.map((model, index) => (
          <div
            key={model.id}
            className="premium-model-card"
            onClick={() => navigate(`/models/${model.id}/dashboard`)}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="premium-model-top">
              <div className="premium-model-icon">{model.shortName}</div>
              <div className="premium-model-badge">{model.badge}</div>
            </div>

            <div className="premium-model-body">
              <div className="premium-model-content">
                <h2 className="premium-model-title">{model.name}</h2>
                <p className="premium-model-category">{model.category}</p>
                <p className="premium-model-description">
                  {model.description}
                </p>
              </div>

              <div className="premium-model-features">
                <span>Versions</span>
                <span>Lineage</span>
                <span>Verify</span>
                <span>Audit Trail</span>
                <span>Integrity</span>
                <span>History</span>            </div>
            </div>

            <div className="premium-model-footer">
              <button
                className="premium-model-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/models/${model.id}/dashboard`);
                }}
              >
                Open Workspace →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM INFO */}
      <div className="models-showcase-strip">
        <div className="models-showcase-card">
          <p className="models-showcase-label">Why it matters</p>
          <h3>Every model should have its own evolution trail</h3>
          <p>
            Each workspace helps you monitor training runs, performance shifts,
            experiment history, and verification checkpoints in one place.
          </p>
        </div>

        <div className="models-showcase-card">
          <p className="models-showcase-label">Engineering Perspective</p>
          <h3>Built like a modern ML operations platform</h3>
          <p>
            This goes beyond training — it introduces structured AI workflows
            with version control, analytics, traceability, and model governance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ModelsPage;
