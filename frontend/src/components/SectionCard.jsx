function SectionCard({ title, children, style = {}, className = "" }) {
  return (
    <div
      className={`page-card section-card ${className}`}
      style={style}
    >
      {title && (
        <div className="section-card-header">
          <h2 className="section-card-title">{title}</h2>
        </div>
      )}

      <div className="section-card-body">{children}</div>
    </div>
  );
}

export default SectionCard;