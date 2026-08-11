function PageHeader({ title, subtitle }) {
  return (
    <div className="page-header">
      <h2 className="page-title">{title}</h2>
      <p className="page-subtitle">{subtitle}</p>
    </div>
  );
}

export default PageHeader;