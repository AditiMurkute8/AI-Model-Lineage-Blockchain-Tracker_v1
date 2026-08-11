function VersionComparison({ versions }) {
  if (!versions || versions.length < 2) return null;

  return (
    <div className="comparison-section">
      <h2 className="comparison-title">Version Comparison</h2>
      <p className="comparison-subtitle">
        Compare the latest two model versions side by side
      </p>

      <div className="comparison-grid">
        {versions.slice(0, 2).map((version, index) => (
          <div key={index} className="comparison-card">
            <div className="comparison-card-header">
              <h3 className="comparison-version">{version.version_id}</h3>
              <span className="comparison-badge">
                {version.model_type || "Model"}
              </span>
            </div>

            <div className="comparison-items">
              <ComparisonItem label="Accuracy" value={version.accuracy} />
              <ComparisonItem label="Precision" value={version.precision} />
              <ComparisonItem label="Recall" value={version.recall} />
              <ComparisonItem label="Training Samples" value={version.training_samples} />
              <ComparisonItem label="Features Used" value={version.features_used} />
              <ComparisonItem label="Dataset Name" value={version.dataset_name} />
              <ComparisonItem label="Previous Version" value={version.previous_version || "None"} />
              <ComparisonItem label="Lineage Depth" value={version.lineage_depth} />
            </div>

            <div className="comparison-notes">
              <h4>Experiment Note</h4>
              <p>{version.experiment_note || "No notes"}</p>

              <h4>Code Changes</h4>
              <p>{version.code_change_summary || "No changes"}</p>

              <h4>Code Snippet</h4>
              <pre>{version.code_snippet || "N/A"}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonItem({ label, value }) {
  return (
    <div className="comparison-item">
      <p className="comparison-label">{label}</p>
      <p className="comparison-value">{value ?? "-"}</p>
    </div>
  );
}

export default VersionComparison;