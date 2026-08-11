function PageHeader({ title, subtitle, align = "left" }) {
  return (
    <div className={`page-header ${align === "center" ? "centered" : ""}`}>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}

export default PageHeader;