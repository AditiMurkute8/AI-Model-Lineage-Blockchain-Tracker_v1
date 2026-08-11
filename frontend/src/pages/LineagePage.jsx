import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getVersions } from "../services/api";
import { getModelMeta } from "../utils/modelMeta";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import InfoBox from "../components/InfoBox";

function LineagePage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("flow");

  const navigate = useNavigate();
  const location = useLocation();
  const { modelId = "logistic-regression" } = useParams();

  const isAI = location.pathname.startsWith("/ai");
  const basePath = isAI ? "/ai" : "/models";

  const model = getModelMeta(modelId);

  useEffect(() => {
    loadVersions();
    window.scrollTo(0, 0);
  }, [modelId, isAI]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(modelId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lineage load error:", err);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedVersions = useMemo(() => {
    return [...versions].sort(
      (a, b) =>
        parseInt((a.version_id || "v0").replace("v", ""), 10) -
        parseInt((b.version_id || "v0").replace("v", ""), 10)
    );
  }, [versions]);

  const totalNodes = sortedVersions.length;
  const rootVersion = sortedVersions[0]?.version_id || "N/A";
  const latestVersion =
    sortedVersions[sortedVersions.length - 1]?.version_id || "N/A";

  const averageAccuracy =
    sortedVersions.length > 0
      ? (
          sortedVersions.reduce(
            (sum, version) => sum + Number(version.accuracy || 0),
            0
          ) / sortedVersions.length
        ).toFixed(4)
      : "0.0000";

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Evolution Layer" : model.badge}
        </div>

        <PageHeader
          title={`${model.name} ${isAI ? "Evolution Trail" : "Lineage"}`}
          subtitle={
            isAI
              ? `Explore how ${model.name} evolved through learning progression, intelligence adaptation, and behavior refinement.`
              : `Explore how your ${model.name} evolved across immutable tracked versions with lineage and traceability views.`
          }
        />
      </div>

      {/* SUMMARY STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Evolution Steps" : "Tracked Versions"}
          </p>
          <h2 className="stat-value">{totalNodes}</h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Initial Intelligence" : "Root Version"}
          </p>
          <h2 className="stat-value">{rootVersion}</h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Latest Intelligence" : "Latest Version"}
          </p>
          <h2 className="stat-value">{latestVersion}</h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Avg Confidence" : "Avg Accuracy"}
          </p>
          <h2 className="stat-value">{averageAccuracy}</h2>
        </div>
      </div>

      {/* INTELLIGENCE / TRACEABILITY SUMMARY */}
      {!loading && sortedVersions.length > 0 && (
        <SectionCard
          title={isAI ? "Evolution Intelligence" : "Traceability Intelligence"}
        >
          <div className="info-grid">
            <InfoBox
              label={isAI ? "Evolution Depth" : "Chain Depth"}
              value={`${totalNodes} ${isAI ? "learning stages" : "linked versions"}`}
            />
            <InfoBox
              label={isAI ? "Learning Direction" : "Audit Continuity"}
              value={getLineageDirection(sortedVersions, isAI)}
            />
            <InfoBox
              label={isAI ? "Confidence Trend" : "Accuracy Stability"}
              value={getLineageTrend(sortedVersions, isAI)}
            />
            <InfoBox
              label={isAI ? "Intelligence Verdict" : "Traceability Verdict"}
              value={getLineageVerdict(sortedVersions, isAI)}
            />
          </div>
        </SectionCard>
      )}

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <TabButton
          label={isAI ? "Learning Flow" : "Flow View"}
          active={activeView === "flow"}
          onClick={() => setActiveView("flow")}
        />
        <TabButton
          label={isAI ? "Intelligence Cards" : "Cards View"}
          active={activeView === "cards"}
          onClick={() => setActiveView("cards")}
        />
        <TabButton
          label={isAI ? "Evolution Graph" : "Graph View"}
          active={activeView === "graph"}
          onClick={() => setActiveView("graph")}
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI ? "Loading evolution trail..." : "Loading lineage..."}
          </p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && sortedVersions.length === 0 && (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? `No AI evolution data available yet. Start training your first ${model.name} intelligence run.`
              : `No lineage data available yet. Train your first ${model.name} model.`}
          </p>
        </div>
      )}

      {/* VIEWS */}
      {!loading && sortedVersions.length > 0 && (
        <>
          {activeView === "flow" && (
            <FlowView
              versions={sortedVersions}
              navigate={navigate}
              modelId={modelId}
              basePath={basePath}
              isAI={isAI}
            />
          )}

          {activeView === "cards" && (
            <CardsView
              versions={sortedVersions}
              navigate={navigate}
              modelId={modelId}
              basePath={basePath}
              isAI={isAI}
            />
          )}

          {activeView === "graph" && (
            <GraphView
              versions={sortedVersions}
              navigate={navigate}
              modelId={modelId}
              basePath={basePath}
              isAI={isAI}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ================= FLOW VIEW ================= */

function FlowView({ versions, navigate, modelId, basePath, isAI }) {
  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    return Number.isNaN(num) ? value : num.toFixed(4);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        paddingBottom: "8px",
      }}
    >
      {versions.map((v, i) => (
        <div
          key={v.version_id}
          style={{ display: "flex", alignItems: "center", gap: "16px" }}
        >
          <div
            className="version-card premium-version-card"
            style={{ minWidth: "280px", cursor: "pointer" }}
            onClick={() =>
              navigate(`${basePath}/${modelId}/version/${v.version_id}`)
            }
          >
            <div className="version-left-block">
              <p className="version-label">
                {isAI ? "Learning Step" : "Ledger Version"}
              </p>

              <h3 className="version-id-main">{v.version_id}</h3>

              <div className="version-status-row">
                <span className="version-status-pill">
                  {v.previous_version
                    ? isAI
                      ? "Adaptive Upgrade"
                      : "Linked Evolution"
                    : isAI
                    ? "Initial Intelligence"
                    : "Genesis Version"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <p className="version-card-text">
                <strong>{isAI ? "Confidence:" : "Accuracy:"}</strong>{" "}
                {formatMetric(v.accuracy)}
              </p>

              <p className="version-card-text">
                <strong>{isAI ? "Previous Intelligence:" : "Previous:"}</strong>{" "}
                {v.previous_version || "None"}
              </p>
            </div>
          </div>

          {i < versions.length - 1 && (
            <div
              style={{
                fontSize: "26px",
                color: "#38bdf8",
                fontWeight: "800",
              }}
            >
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= CARDS VIEW ================= */

function CardsView({ versions, navigate, modelId, basePath, isAI }) {
  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    return Number.isNaN(num) ? value : num.toFixed(4);
  };

  return (
    <div className="recent-versions-grid">
      {versions.map((v) => (
        <div
          key={v.version_id}
          className="version-card premium-version-card"
          onClick={() => navigate(`${basePath}/${modelId}/version/${v.version_id}`)}
        >
          <div className="version-left-block">
            <p className="version-label">
              {isAI ? "Intelligence Snapshot" : "Audit Snapshot"}
            </p>

            <h3 className="version-id-main">{v.version_id}</h3>

            <div className="version-status-row">
              <span className="version-status-pill">
                {v.previous_version
                  ? isAI
                    ? "Learning Upgrade"
                    : "Version Linked"
                  : isAI
                  ? "Base Intelligence"
                  : "Base Version"}
              </span>
            </div>
          </div>

          <div className="version-right-block" style={{ marginTop: "12px" }}>
            <div className="metric-tile">
              <span>{isAI ? "Confidence" : "Accuracy"}</span>
              <h4>{formatMetric(v.accuracy)}</h4>
            </div>

            <div className="metric-tile">
              <span>{isAI ? "Trust" : "Precision"}</span>
              <h4>{formatMetric(v.precision)}</h4>
            </div>

            <div className="metric-tile">
              <span>{isAI ? "Stability" : "Recall"}</span>
              <h4>{formatMetric(v.recall)}</h4>
            </div>
          </div>

          <div className="version-bottom-row">
            <div className="version-prev-box">
              <span className="prev-label">
                {isAI ? "Previous Intelligence" : "Previous"}
              </span>
              <p className="prev-value">{v.previous_version || "None"}</p>
            </div>

            <button className="version-open-btn">
              {isAI ? "View Evolution →" : "Open Lineage →"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= GRAPH VIEW ================= */

function GraphView({ versions, navigate, modelId, basePath, isAI }) {
  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    return Number.isNaN(num) ? value : num.toFixed(4);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {versions.map((v, index) => (
        <div
          key={v.version_id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            onClick={() =>
              navigate(`${basePath}/${modelId}/version/${v.version_id}`)
            }
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              cursor: "pointer",
              color: "#fff",
              boxShadow: "0 18px 34px rgba(37, 99, 235, 0.28)",
              flexShrink: 0,
            }}
          >
            {v.version_id}
          </div>

          <div className="page-card" style={{ flex: 1 }}>
            <p className="version-card-text">
              <strong>{isAI ? "Confidence:" : "Accuracy:"}</strong>{" "}
              {formatMetric(v.accuracy)}
            </p>

            <p className="version-card-text">
              <strong>{isAI ? "Trust Score:" : "Precision:"}</strong>{" "}
              {formatMetric(v.precision)}
            </p>

            <p className="version-card-text">
              <strong>{isAI ? "Stability:" : "Recall:"}</strong>{" "}
              {formatMetric(v.recall)}
            </p>

            <p className="version-card-text">
              <strong>{isAI ? "Parent Intelligence:" : "Previous:"}</strong>{" "}
              {v.previous_version || "None"}
            </p>
          </div>

          {index < versions.length - 1 && (
            <div
              style={{
                fontSize: "24px",
                color: "#38bdf8",
                fontWeight: "800",
                width: "100%",
                marginLeft: "34px",
              }}
            >
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= TAB BUTTON ================= */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 18px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(135deg, #0ea5e9, #2563eb)"
          : "rgba(30,41,59,0.8)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "700",
        transition: "0.2s",
        boxShadow: active
          ? "0 14px 28px rgba(37, 99, 235, 0.22)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}

/* ================= HELPERS ================= */

function getLineageDirection(versions, isAI) {
  if (!versions || versions.length < 2) {
    return isAI ? "Initial learning stage" : "Single-node lineage";
  }

  const first = Number(versions[0]?.accuracy || 0);
  const last = Number(versions[versions.length - 1]?.accuracy || 0);

  if (last > first) {
    return isAI ? "Improving adaptive intelligence" : "Performance advancing through chain";
  }

  if (last < first) {
    return isAI ? "Refinement instability detected" : "Performance declined across lineage";
  }

  return isAI ? "Stable learning behavior" : "Stable version continuity";
}

function getLineageTrend(versions, isAI) {
  if (!versions || versions.length < 2) {
    return isAI ? "Insufficient confidence history" : "Insufficient audit history";
  }

  const metrics = versions.map((v) => Number(v.accuracy || 0));
  const max = Math.max(...metrics);
  const min = Math.min(...metrics);
  const spread = max - min;

  if (spread < 0.02) {
    return isAI ? "Highly stable confidence pattern" : "Highly stable accuracy pattern";
  }

  if (spread < 0.06) {
    return isAI ? "Moderately stable learning pattern" : "Moderately stable version performance";
  }

  return isAI ? "High learning fluctuation detected" : "High performance variance across chain";
}

function getLineageVerdict(versions, isAI) {
  if (!versions || versions.length === 0) {
    return isAI ? "No intelligence verdict available" : "No traceability verdict available";
  }

  const avg =
    versions.reduce((sum, v) => sum + Number(v.accuracy || 0), 0) /
    versions.length;

  if (avg >= 0.9) {
    return isAI ? "Excellent intelligence evolution" : "Highly trustworthy version chain";
  }

  if (avg >= 0.8) {
    return isAI ? "Strong learning progression" : "Reliable lineage continuity";
  }

  if (avg >= 0.7) {
    return isAI ? "Moderate intelligence maturity" : "Moderately consistent lineage";
  }

  return isAI ? "Evolution requires further refinement" : "Lineage shows weaker performance consistency";
}

export default LineagePage;