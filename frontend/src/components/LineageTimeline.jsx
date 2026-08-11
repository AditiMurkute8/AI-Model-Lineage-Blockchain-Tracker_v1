function LineageTimeline({ versions }) {
  if (!versions || versions.length === 0) {
    return null;
  }

  const sortedVersions = [...versions].sort((a, b) => {
    const aNum = parseInt((a.version_id || "v0").replace("v", ""));
    const bNum = parseInt((b.version_id || "v0").replace("v", ""));
    return aNum - bNum;
  });

  return (
    <div className="timeline-section">
      <h2 className="timeline-title">Model Lineage Timeline</h2>
      <p className="timeline-subtitle">
        Visual representation of how the model evolved across versions
      </p>

      <div className="timeline-wrapper">
        {sortedVersions.map((version, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-dot"></div>

            {index !== sortedVersions.length - 1 && (
              <div className="timeline-line"></div>
            )}

            <div className="timeline-card">
              <div className="timeline-card-header">
                <h3 className="timeline-version">{version.version_id}</h3>
                <span className="timeline-model-type">
                  {version.model_type || "Model"}
                </span>
              </div>

              <div className="timeline-meta">
                <p>
                  <strong>Previous:</strong>{" "}
                  {version.previous_version || "None"}
                </p>
                <p>
                  <strong>Accuracy:</strong>{" "}
                  {version.accuracy !== undefined ? version.accuracy : "-"}
                </p>
                <p>
                  <strong>Training Samples:</strong>{" "}
                  {version.training_samples || "-"}
                </p>
                <p>
                  <strong>Dataset:</strong>{" "}
                  {version.dataset_name || "-"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LineageTimeline;