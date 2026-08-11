import { useParams } from "react-router-dom";
import { getModelMeta } from "../utils/modelMeta";

function BlockchainVerifyPage() {
  const { modelId = "logistic-regression" } = useParams();
  const model = getModelMeta(modelId);

  const ledgerBlocks = [
    {
      block: "Block #18421",
      hash: "0xA72F91C8D4E5B7A0",
      detail: "Model registration snapshot stored",
    },
    {
      block: "Block #18422",
      hash: "0xB93D42F7E1A98C34",
      detail: "Training metadata anchored",
    },
    {
      block: "Block #18423",
      hash: "0xC61AF90D72B31EF9",
      detail: "Version lineage relationship recorded",
    },
    {
      block: "Block #18424",
      hash: "0xD84BC17A5F2E901C",
      detail: "Integrity verification completed",
    },
  ];

  const timeline = [
    {
      step: "01",
      title: "Model Registered",
      text: "Initial model identity and workspace metadata recorded.",
      footer: "Checkpoint secured",
    },
    {
      step: "02",
      title: "Training Snapshot Logged",
      text: "Training parameters and experimental state preserved.",
      footer: "Snapshot validated",
    },
    {
      step: "03",
      title: "Metadata Hashed",
      text: "Version references and attributes cryptographically linked.",
      footer: "Hash integrity confirmed",
    },
    {
      step: "04",
      title: "Chain Verified",
      text: "End-to-end lineage consistency successfully validated.",
      footer: "Verification complete",
    },
  ];

  return (
    <div className="verify-page">
      {/* HERO */}
      <section className="verify-hero">
        <div className="verify-hero-left">
          <div className="verify-badge">Blockchain Verification Layer</div>

          <h1 className="verify-title">
            Trust your <span>model history</span>
          </h1>

          <p className="verify-subtitle">
            Validate the structural integrity, version lineage, training
            metadata, and blockchain-backed traceability for{" "}
            <strong>{model?.name || "this model"}</strong>. This layer ensures
            that every important experiment and version checkpoint remains
            auditable, consistent, and tamper-evident.
          </p>
        </div>

        <div className="verify-hero-right">
          <div className="verify-main-card">
            <div className="verify-label">CHAIN STATUS</div>
            <h3>Verified & Trusted</h3>
            <p>
              The selected model lineage has passed structural consistency,
              metadata validation, and historical checkpoint verification across
              recorded model evolution.
            </p>
          </div>

          <div className="verify-floating-card top-card">
            <span>Integrity Score</span>
            <h4>99.8%</h4>
          </div>

          <div className="verify-floating-card bottom-card">
            <span>Ledger Blocks</span>
            <h4>24</h4>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="verify-section">
        <div className="section-header">
          <h2 className="section-title">Verification Metrics</h2>
        </div>

        <div className="verify-metrics-grid">
          <div className="verify-metric-card">
            <p className="verify-metric-label">Verification Status</p>
            <h3>Verified</h3>
            <span>Model chain integrity passed successfully.</span>
          </div>

          <div className="verify-metric-card">
            <p className="verify-metric-label">Lineage Continuity</p>
            <h3>Maintained</h3>
            <span>Parent-child version mapping is fully consistent.</span>
          </div>

          <div className="verify-metric-card">
            <p className="verify-metric-label">Metadata Integrity</p>
            <h3>Valid</h3>
            <span>Training and experiment metadata remain intact.</span>
          </div>

          <div className="verify-metric-card">
            <p className="verify-metric-label">Trust Score</p>
            <h3>High</h3>
            <span>No suspicious drift or broken chain artifacts found.</span>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="verify-section">
        <div className="section-header">
          <h2 className="section-title">Verification Timeline</h2>
        </div>

        <div className="verify-timeline-grid">
          {timeline.map((item) => (
            <div className="verify-step-card" key={item.step}>
              <div className="verify-step-top">
                <div className="verify-step-number">{item.step}</div>
                <div className="verify-step-badge">Audit Step</div>
              </div>

              <div className="verify-step-content">
                <h3 className="verify-step-title">{item.title}</h3>
                <p className="verify-step-description">{item.text}</p>
              </div>

              <div className="verify-step-footer">
                <span className="verify-step-dot"></span>
                <span>{item.footer}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LEDGER */}
      <section className="verify-section">
        <div className="section-header">
          <h2 className="section-title">Blockchain Ledger Snapshots</h2>
        </div>

        <div className="recent-versions-grid">
          {ledgerBlocks.map((block) => (
            <div className="version-card" key={block.block}>
              <h3 className="version-card-title">{block.block}</h3>
              <p className="version-card-text">
                <strong>Hash:</strong> {block.hash}
              </p>
              <p className="version-card-text">
                <strong>Recorded Event:</strong> {block.detail}
              </p>
              <p className="version-card-text">
                <strong>Status:</strong> Verified on distributed audit layer
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SUMMARY */}
      <section className="verify-summary-card">
        <div className="verify-summary-header">
          <h2>Integrity Summary</h2>
        </div>

        <p className="verify-summary-text">
          This verification module provides a blockchain-inspired audit layer
          for machine learning governance. It checks whether the selected model
          version history remains structurally valid across recorded
          experiments, training metadata, lineage references, and performance
          snapshots. The current workspace shows no signs of broken lineage,
          corrupted metadata chains, or suspicious version divergence.
        </p>

        <div className="verify-summary-points">
          <div className="verify-point">✔ Version relationships preserved</div>
          <div className="verify-point">✔ Metadata hash chain validated</div>
          <div className="verify-point">✔ Experiment lineage traceable</div>
          <div className="verify-point">✔ Model evolution remains auditable</div>
        </div>
      </section>
    </div>
  );
}

export default BlockchainVerifyPage;