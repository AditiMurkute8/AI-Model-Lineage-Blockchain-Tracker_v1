import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getModelMeta } from "../utils/modelMeta";

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { modelId } = useParams();

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const pathname = location.pathname;

  const isAIWorkspace = pathname.startsWith("/ai");
  const isBlockchainWorkspace = pathname.startsWith("/models");
  const isModelWorkspace = !!modelId;

  const model = modelId ? getModelMeta(modelId) : null;

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const pageTitle = useMemo(() => {
    if (pathname === "/ai") return "AI Model Workspaces";
    if (pathname === "/models") return "Blockchain Model Workspaces";

    if (pathname.includes("/dashboard")) {
      return isAIWorkspace ? "AI Dashboard" : "Blockchain Dashboard";
    }

    if (pathname.includes("/versions")) {
      return isAIWorkspace ? "Learning Versions" : "Version Ledger";
    }

    if (pathname.includes("/lineage")) {
      return isAIWorkspace ? "Intelligence Evolution" : "Lineage Intelligence";
    }

    if (pathname.includes("/compare")) {
      return isAIWorkspace ? "AI Comparison" : "Model Comparison";
    }

    if (pathname.includes("/train")) {
      return isAIWorkspace ? "Train Intelligence" : "Train Model";
    }

    if (pathname.includes("/analytics")) {
      return isAIWorkspace ? "AI Analytics" : "Blockchain Analytics";
    }

    if (pathname.includes("/blockchain-verify")) {
      return "Blockchain Verification";
    }

    if (pathname.includes("/version/")) {
      return isAIWorkspace ? "Intelligence Snapshot" : "Version Details";
    }

    return "AI + Blockchain Workspace";
  }, [pathname, isAIWorkspace]);

  const workspaceLabel = useMemo(() => {
    if (isAIWorkspace && model) return `${model.name} • AI Intelligence`;
    if (isBlockchainWorkspace && model) {
      return `${model.name} • Blockchain Traceability`;
    }

    if (pathname === "/ai") return "AI Intelligence Workspace";
    if (pathname === "/models") return "Blockchain Integrity Workspace";

    return "AI + Blockchain Model Intelligence";
  }, [pathname, model, isAIWorkspace, isBlockchainWorkspace]);

  const modeBadge = useMemo(() => {
    if (isAIWorkspace) {
      return {
        text: "AI Mode",
        className: "ai-badge",
        icon: "🧠",
      };
    }

    if (isBlockchainWorkspace) {
      return {
        text: "Blockchain Mode",
        className: "blockchain-badge",
        icon: "⛓",
      };
    }

    return {
      text: "Hybrid Workspace",
      className: "hybrid-badge",
      icon: "⚡",
    };
  }, [isAIWorkspace, isBlockchainWorkspace]);

  return (
    <div
      className={`topbar premium-topbar ${
        isAIWorkspace
          ? "topbar-ai"
          : isBlockchainWorkspace
          ? "topbar-blockchain"
          : "topbar-hybrid"
      }`}
    >
      {/* LEFT */}
      <div className="topbar-left">
        <button
          className="topbar-btn topbar-icon-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <button
          className="topbar-btn secondary-topbar-btn"
          onClick={() => navigate("/")}
        >
          Home
        </button>

        <button
          className={`topbar-btn secondary-topbar-btn ${
            pathname.startsWith("/ai") ? "topbar-nav-active" : ""
          }`}
          onClick={() => navigate("/ai")}
        >
          AI
        </button>

        <button
          className={`topbar-btn secondary-topbar-btn ${
            pathname.startsWith("/models") ? "topbar-nav-active" : ""
          }`}
          onClick={() => navigate("/models")}
        >
          Blockchain
        </button>
      </div>

      {/* CENTER */}
      <div className="topbar-center">
        <div className="topbar-page-info">
          <div className="topbar-mode-row">
            <p className="topbar-page-label">{workspaceLabel}</p>

            <span className={`topbar-mode-badge ${modeBadge.className}`}>
              <span className="topbar-mode-icon">{modeBadge.icon}</span>
              {modeBadge.text}
            </span>
          </div>

          <h3 className="topbar-page-title">{pageTitle}</h3>

          {isModelWorkspace && model && (
            <p className="topbar-model-meta">
              {model.category} • {isAIWorkspace ? "Intelligent Analysis Layer" : "Secure Traceability Layer"}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="topbar-right">
        <div className="theme-card premium-theme-card">
          <span className="theme-label">
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>

          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopBar;