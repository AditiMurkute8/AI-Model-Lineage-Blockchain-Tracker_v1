import VersionBadge from "./VersionBadge";
import { getVersionBadges } from "../utils/versionBadges";

function VersionPreviewCard({ version, isAI }) {
  const badges = getVersionBadges(version, null, isAI);

  return (
    <div className="version-card premium-version-card">
      <h3 className="version-id-main">{version.version_id}</h3>

      {/* BADGES */}
      <div style={{ marginBottom: "10px" }}>
        {badges.map((b, i) => (
          <VersionBadge key={i} label={b.label} type={b.type} />
        ))}
      </div>

      <p>Accuracy: {version.accuracy}</p>
      <p>Precision: {version.precision}</p>
      <p>Recall: {version.recall}</p>
    </div>
  );
}

export default VersionPreviewCard;