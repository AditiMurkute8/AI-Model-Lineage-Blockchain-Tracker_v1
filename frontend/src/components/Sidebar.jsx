import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getModelMeta } from "../utils/modelMeta";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);

  const sectionType = pathParts[0];
  const modelId = pathParts[1] || "logistic-regression";

  const isAIWorkspace = sectionType === "ai";
  const isBlockchainWorkspace = sectionType === "models";

  const basePath = isAIWorkspace ? "/ai" : "/models";
  const model = getModelMeta(modelId);

  const navItems = isAIWorkspace
    ? [
        {
          label: "Overview",
          path: `${basePath}/${modelId}/dashboard`,
        },
        {
          label: "Behavior Monitor",
          path: `${basePath}/${modelId}/analytics`,
        },
        {
          label: "Learning Memory",
          path: `${basePath}/${modelId}/versions`,
        },
        {
          label: "Intelligence Evolution",
          path: `${basePath}/${modelId}/lineage`,
        },
        {
          label: "Decision Compare",
          path: `${basePath}/${modelId}/compare`,
        },
        {
          label: "Train Intelligence",
          path: `${basePath}/${modelId}/train`,
        },
        {
          label: "Trust Signals",
          path: `${basePath}/${modelId}/blockchain-verify`,
        },
      ]
    : [
        {
          label: "Dashboard",
          path: `${basePath}/${modelId}/dashboard`,
        },
        {
          label: "Version Ledger",
          path: `${basePath}/${modelId}/versions`,
        },
        {
          label: "Lineage Chain",
          path: `${basePath}/${modelId}/lineage`,
        },
        {
          label: "Version Compare",
          path: `${basePath}/${modelId}/compare`,
        },
        {
          label: "Train Model",
          path: `${basePath}/${modelId}/train`,
        },
        {
          label: "Performance Analytics",
          path: `${basePath}/${modelId}/analytics`,
        },
        {
          label: "Blockchain Verify",
          path: `${basePath}/${modelId}/blockchain-verify`,
        },
      ];

  const getBrandTitle = () => {
    if (isAIWorkspace) return "Neural Intelligence Hub";
    if (isBlockchainWorkspace) return "Blockchain Integrity Hub";
    return "Hybrid Model Workspace";
  };

  const getBrandSubtitle = () => {
    if (isAIWorkspace) return "Behavior • Adaptation • Learning";
    if (isBlockchainWorkspace) return "Audit • Security • Traceability";
    return "AI + Blockchain Model System";
  };

  const getWorkspaceType = () => {
    if (isAIWorkspace) return "AI Workspace";
    if (isBlockchainWorkspace) return "Blockchain Workspace";
    return "ML Workspace";
  };

  const getSectionLabel = () => {
    if (isAIWorkspace) return "INTELLIGENCE FLOW";
    if (isBlockchainWorkspace) return "INTEGRITY FLOW";
    return "WORKSPACE NAVIGATION";
  };

  const getModeBadge = () => {
    if (isAIWorkspace) return "🧠 AI Layer";
    if (isBlockchainWorkspace) return "⛓ Integrity Layer";
    return "⚡ Hybrid";
  };

  const handleBack = () => {
    navigate(basePath);
  };

  return (
    <aside
      className={`sidebar premium-sidebar ${
        isAIWorkspace
          ? "sidebar-ai-mode"
          : isBlockchainWorkspace
          ? "sidebar-blockchain-mode"
          : "sidebar-default-mode"
      }`}
    >
      {/* BRAND */}
      <div className="sidebar-brand">
        <div className="sidebar-mode-badge">{getModeBadge()}</div>
        <h1>{getBrandTitle()}</h1>
        <p>{getBrandSubtitle()}</p>
      </div>

      {/* ACTIVE MODEL */}
      <div className="sidebar-model-card clickable" onClick={handleBack}>
        <div className="sidebar-model-icon">{model?.shortName || "AI"}</div>

        <div className="sidebar-model-info">
          <h3>{model?.name || "Unknown Model"}</h3>
          <p>{model?.category || getWorkspaceType()}</p>
        </div>
      </div>

      {/* BACK BUTTON */}
      <button
        className={`secondary-button sidebar-back-btn ${
          isAIWorkspace ? "sidebar-back-ai" : "sidebar-back-blockchain"
        }`}
        onClick={handleBack}
      >
        ← Back to {isAIWorkspace ? "AI Models" : "Blockchain Models"}
      </button>

      {/* DIVIDER */}
      <div className="sidebar-divider" />

      {/* SECTION */}
      <div className="sidebar-section-label">{getSectionLabel()}</div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end
            className={({ isActive }) =>
              isActive
                ? `sidebar-link premium-link active ${
                    isAIWorkspace ? "ai-sidebar-link" : "blockchain-sidebar-link"
                  }`
                : `sidebar-link premium-link ${
                    isAIWorkspace ? "ai-sidebar-link" : "blockchain-sidebar-link"
                  }`
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