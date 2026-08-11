function InfoBox({ label, value, highlight = false, mono = false }) {
  return (
    <div className="info-box">
      <p className="info-label">{label}</p>

      <div
        className={`info-value ${
          highlight ? "highlight" : ""
        } ${mono ? "mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export default InfoBox;