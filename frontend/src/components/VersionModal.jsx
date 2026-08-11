import InfoBox from "./InfoBox";
import ExperimentSection from "./ExperimentSection";
import { formatDate, formatMetric } from "../utils/formatters";

function VersionModal({ version, onClose }) {
  if (!version) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{version.version_id} Details</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="metadata-grid">
          <InfoBox label="Dataset Name" value={version.dataset_name} />
          <InfoBox label="Training Time" value={formatDate(version.training_time)} />
          <InfoBox label="Features Used" value={version.features_used} />
          <InfoBox label="Training Samples" value={version.training_samples} />
          <InfoBox label="Accuracy" value={formatMetric(version.accuracy)} />
          <InfoBox label="Precision" value={formatMetric(version.precision)} />
          <InfoBox label="Recall" value={formatMetric(version.recall)} />
          <InfoBox label="Previous Version" value={version.previous_version || "None"} />
          <InfoBox label="Lineage Depth" value={version.lineage_depth} />
          <InfoBox label="Model ID" value={version.model_id} />
          <InfoBox label="Model Type" value={version.model_type} />
        </div>

        <div className="hash-section">
          <p className="section-label">Dataset Hash</p>
          <p className="hash-value">{version.dataset_hash || "N/A"}</p>
        </div>

        <ExperimentSection version={version} />
      </div>
    </div>
  );
}

export default VersionModal;