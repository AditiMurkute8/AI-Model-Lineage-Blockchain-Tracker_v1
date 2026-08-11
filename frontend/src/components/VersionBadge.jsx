function VersionBadge({ label, type = "neutral" }) {
  return (
    <span className={`version-badge badge-${type}`}>
      {label}
    </span>
  );
}

export default VersionBadge;