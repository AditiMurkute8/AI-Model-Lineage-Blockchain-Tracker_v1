function DetailInfoCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(2, 6, 23, 0.85)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "18px",
        padding: "20px",
        minHeight: "110px",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        {label}
      </p>

      <h4
        style={{
          margin: 0,
          color: "#ffffff",
          fontSize: "20px",
          fontWeight: "700",
          wordBreak: "break-word",
          lineHeight: "1.5",
        }}
      >
        {value || "-"}
      </h4>
    </div>
  );
}

export default DetailInfoCard;