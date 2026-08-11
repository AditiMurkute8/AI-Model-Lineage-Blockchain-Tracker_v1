import { formatMetric } from "../utils/formatters";

function VersionCard({ version, onViewDetails }) {
  return (
    <div className="version-card compact-card">
      <div className="version-header compact-header">
        <h2 className="version-title">{version.version_id}</h2>
        <span className="model-badge">
          {version.model_type || "AI Model"}
        </span>
      </div>

      <div className="compact-metrics">
        <div className="metric-item">
          <p className="metric-label">Accuracy</p>
          <p className="metric-value">{formatMetric(version.accuracy)}</p>
        </div>

        <div className="metric-item">
          <p className="metric-label">Precision</p>
          <p className="metric-value">{formatMetric(version.precision)}</p>
        </div>

        <div className="metric-item">
          <p className="metric-label">Recall</p>
          <p className="metric-value">{formatMetric(version.recall)}</p>
        </div>

        <div className="metric-item">
          <p className="metric-label">Previous</p>
          <p className="metric-value">{version.previous_version || "None"}</p>
        </div>
      </div>

      <div className="details-button-wrapper">
        <button className="details-button" onClick={() => onViewDetails(version)}>
          View Details
        </button>
      </div>
    </div>
  );
}

export default VersionCard;