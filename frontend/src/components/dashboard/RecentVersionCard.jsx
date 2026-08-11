import { useNavigate } from "react-router-dom";

function RecentVersionCard({ version }) {
  const navigate = useNavigate();

  return (
    <div
      className="recent-version-card"
      onClick={() => navigate(`/version/${version.version_id}`)}
    >
      <h3>{version.version_id}</h3>
      <p><strong>Accuracy:</strong> {version.accuracy ?? "-"}</p>
      <p><strong>Precision:</strong> {version.precision ?? "-"}</p>
      <p><strong>Recall:</strong> {version.recall ?? "-"}</p>
      <p><strong>Previous:</strong> {version.previous_version ?? "None"}</p>
    </div>
  );
}

export default RecentVersionCard;