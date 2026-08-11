function ExperimentSection({ version }) {
  return (
    <div className="experiment-section">
      <p className="section-title">Experiment Details</p>

      <div className="experiment-grid">
        <div className="experiment-box">
          <p className="experiment-label">Experiment Note</p>
          <p className="experiment-value">
            {version.experiment_note || "No notes"}
          </p>
        </div>

        <div className="experiment-box">
          <p className="experiment-label">Code Changes</p>
          <p className="experiment-value">
            {version.code_change_summary || "No changes"}
          </p>
        </div>

        <div className="experiment-box full-width">
          <p className="experiment-label">Code Snippet</p>
          <pre className="code-snippet">
            {version.code_snippet || "N/A"}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ExperimentSection;