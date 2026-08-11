import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getModelMeta } from "../utils/modelMeta";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract modelId safely from URL
  const pathParts = location.pathname.split("/").filter(Boolean);
  const modelId = pathParts[1] || "logistic-regression";

  const model = getModelMeta(modelId);

  const navItems = [
    { label: "Dashboard", path: `/models/${modelId}/dashboard` },
    { label: "Versions", path: `/models/${modelId}/versions` },
    { label: "Lineage", path: `/models/${modelId}/lineage` },
    { label: "Compare", path: `/models/${modelId}/compare` },
    { label: "Train Model", path: `/models/${modelId}/train` },
    { label: "Analytics", path: `/models/${modelId}/analytics` },
    {
      label: "Blockchain Verify",
      path: `/models/${modelId}/blockchain-verify`,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>AI Model Tracker</h1>
        <p>Version Lineage System</p>
      </div>

      <div
        className="sidebar-model-card"
        onClick={() => navigate("/models")}
        style={{ cursor: "pointer" }}
      >
        <div className="sidebar-model-icon">{model?.shortName || "ML"}</div>

        <div className="sidebar-model-info">
          <h3>{model?.name || "Model Workspace"}</h3>
          <p>{model?.category || "Machine Learning"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;