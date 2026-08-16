import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { getVersions } from "../services/api";
import PageHeader from "../components/PageHeader";
import { getModelMeta } from "../utils/modelMeta";
import GitCommitPredictCard from "../components/GitCommitPredictCard";

function DashboardPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { modelId = "logistic-regression" } = useParams();

  const isAI = location.pathname.startsWith("/ai");
  const model = getModelMeta(modelId);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadVersions();
  }, [modelId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(modelId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => {
      const aNum = parseInt((a.version_id || "v0").replace("v", ""), 10);
      const bNum = parseInt((b.version_id || "v0").replace("v", ""), 10);
      return aNum - bNum;
    });
  }, [versions]);

  const totalVersions = sortedVersions.length;

  const latestVersion =
    sortedVersions.length > 0
      ? sortedVersions[sortedVersions.length - 1]
      : null;

  const previousVersion =
    sortedVersions.length > 1
      ? sortedVersions[sortedVersions.length - 2]
      : null;

  const averageAccuracy =
    sortedVersions.length > 0
      ? (
          sortedVersions.reduce(
            (sum, version) => sum + Number(version.accuracy || 0),
            0
          ) / sortedVersions.length
        ).toFixed(4)
      : "0.0000";

  const recentVersions = [...sortedVersions].slice(-3).reverse();

  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue.toFixed(4);
  };

  const basePath = isAI ? "/ai" : "/models";

  /* =========================
     AI DERIVED METRICS
  ========================= */
  const aiHealthScore =
    totalVersions > 0 ? (Number(averageAccuracy) * 100).toFixed(1) : "0.0";

  const confidence =
    latestVersion?.accuracy != null
      ? (Number(latestVersion.accuracy) * 100).toFixed(1)
      : "0.0";

  const trustScore =
    latestVersion?.precision != null
      ? (Number(latestVersion.precision) * 100).toFixed(1)
      : "0.0";

  const stability =
    latestVersion?.recall != null
      ? (Number(latestVersion.recall) * 100).toFixed(1)
      : "0.0";

  const learningTrend = getLearningTrend(latestVersion, previousVersion);
  const driftStatus = getDriftStatus(latestVersion, previousVersion);
  const behaviorPattern = getBehaviorPattern(latestVersion, previousVersion);
  const intelligenceSummary = getIntelligenceSummary(
    latestVersion,
    previousVersion
  );

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Intelligence Layer" : "Blockchain Integrity Layer"}
        </div>

        <PageHeader
          title={`${model.name} ${
            isAI ? "AI Overview" : "Blockchain Dashboard"
          }`}
          subtitle={
            isAI
              ? `Monitor intelligence health, confidence behavior, adaptive learning, and model reasoning patterns for ${model.name}.`
              : `Track version lineage, model performance, and immutable verification history for ${model.name}.`
          }
        />
      </div>

      {/* SUMMARY */}
      <div className="model-summary-card">
        <div className="model-summary-item">
          <p className="model-summary-label">Model</p>
          <h3 className="model-summary-value">{model.name}</h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">Category</p>
          <h3 className="model-summary-value">{model.category}</h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">Workspace</p>
          <h3 className="model-summary-value">
            {isAI ? "AI Intelligence" : "Blockchain Traceability"}
          </h3>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading dashboard...</p>
      ) : (
        <>
          {/* ================= AI MODE ================= */}
          {isAI && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">AI Health Score</p>
                  <h2 className="stat-value">{aiHealthScore}%</h2>
                </div>

                <div className="stat-card">
                  <p className="stat-label">Confidence</p>
                  <h2 className="stat-value">{confidence}%</h2>
                </div>

                <div className="stat-card">
                  <p className="stat-label">Trust Score</p>
                  <h2 className="stat-value">{trustScore}%</h2>
                </div>

                <div className="stat-card">
                  <p className="stat-label">Stability</p>
                  <h2 className="stat-value">{stability}%</h2>
                </div>
              </div>

              {/* AI INSIGHT PANELS */}
              <div className="info-grid" style={{ marginTop: "28px" }}>
                <div className="info-box">
                  <p className="info-label">Learning Trend</p>
                  <div className="info-value">{learningTrend}</div>
                </div>

                <div className="info-box">
                  <p className="info-label">Behavior Pattern</p>
                  <div className="info-value">{behaviorPattern}</div>
                </div>

                <div className="info-box">
                  <p className="info-label">Drift Detection</p>
                  <div className="info-value">{driftStatus}</div>
                </div>

                <div className="info-box">
                  <p className="info-label">Active Intelligence</p>
                  <div className="info-value">
                    {totalVersions > 0 ? "Adaptive & Running" : "Inactive"}
                  </div>
                </div>
              </div>

              {/* SMART AI SUMMARY */}
              <div className="page-card" style={{ marginTop: "28px" }}>
                <p className="info-label">AI Interpretation Summary</p>
                <div className="info-value" style={{ marginTop: "10px" }}>
                  {intelligenceSummary}
                </div>
              </div>
            </>
          )}

          {/* ================= BLOCKCHAIN MODE ================= */}
          {!isAI && (
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Total Versions</p>
                <h2 className="stat-value">{totalVersions}</h2>
              </div>

              <div className="stat-card">
                <p className="stat-label">Latest Version</p>
                <h2 className="stat-value">
                  {latestVersion?.version_id || "N/A"}
                </h2>
              </div>

              <div className="stat-card">
                <p className="stat-label">Average Accuracy</p>
                <h2 className="stat-value">{averageAccuracy}</h2>
              </div>

              <div className="stat-card">
                <p className="stat-label">Verification Status</p>
                <h2 className="stat-value">
                  {totalVersions > 0 ? "Verified" : "Unverified"}
                </h2>
              </div>
            </div>
          )}

          {/* ================= GIT COMMIT INTELLIGENCE PREDICT CARD ================= */}
          {modelId === "git-commit-intelligence" && <GitCommitPredictCard />}

          {/* HEADER */}
          <div className="section-header">

            <h2 className="section-title">
              {isAI ? "Recent Intelligence States" : "Recent Versions"}
            </h2>

            <Link
              to={`${basePath}/${modelId}/versions`}
              className="section-button"
            >
              {isAI ? "Open Learning Memory" : "View All Versions"}
            </Link>
          </div>

          {/* CARDS */}
          <div className="recent-versions-grid">
            {recentVersions.length > 0 ? (
              recentVersions.map((version, index) => (
                <div
                  key={version.version_id || index}
                  className="version-card"
                  onClick={() =>
                    navigate(
                      `${basePath}/${modelId}/version/${version.version_id}`
                    )
                  }
                >
                  <h3 className="version-card-title">
                    {version.version_id || `v${index + 1}`}
                  </h3>

                  {isAI ? (
                    <>
                      <p className="version-card-text">
                        <strong>Confidence:</strong>{" "}
                        {formatMetric(version.accuracy)}
                      </p>

                      <p className="version-card-text">
                        <strong>Trust Score:</strong>{" "}
                        {formatMetric(version.precision)}
                      </p>

                      <p className="version-card-text">
                        <strong>Stability:</strong>{" "}
                        {formatMetric(version.recall)}
                      </p>

                      <p className="version-card-text">
                        <strong>Behavior:</strong>{" "}
                        {index === 0
                          ? "Most adaptive intelligence state"
                          : "Learning memory preserved"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="version-card-text">
                        <strong>Accuracy:</strong>{" "}
                        {formatMetric(version.accuracy)}
                      </p>

                      <p className="version-card-text">
                        <strong>Precision:</strong>{" "}
                        {formatMetric(version.precision)}
                      </p>

                      <p className="version-card-text">
                        <strong>Recall:</strong>{" "}
                        {formatMetric(version.recall)}
                      </p>

                      <p className="version-card-text">
                        <strong>Previous:</strong>{" "}
                        {version.previous_version || "None"}
                      </p>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="page-card">
                <p className="loading-text">
                  {isAI
                    ? `No intelligence data yet for ${model.name}. Start training to unlock adaptive insights.`
                    : `No versions yet. Train your first ${model.name} model.`}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================
   AI INTERPRETATION HELPERS
========================= */

function getLearningTrend(latest, previous) {
  if (!latest) return "Initializing";
  if (!previous) return "Bootstrapping";

  const latestAcc = Number(latest.accuracy || 0);
  const prevAcc = Number(previous.accuracy || 0);

  if (latestAcc > prevAcc) return "Improving";
  if (latestAcc < prevAcc) return "Regressing";
  return "Stable";
}

function getDriftStatus(latest, previous) {
  if (!latest || !previous) return "No drift data";

  const accDiff = Math.abs(
    Number(latest.accuracy || 0) - Number(previous.accuracy || 0)
  );

  if (accDiff > 0.08) return "High Drift Detected";
  if (accDiff > 0.03) return "Moderate Drift";
  return "Low Drift";
}

function getBehaviorPattern(latest, previous) {
  if (!latest || !previous) return "Initial learning behavior";

  const precision = Number(latest.precision || 0);
  const recall = Number(latest.recall || 0);

  if (precision > 0.9 && recall < 0.75) return "Possible overfitting pattern";
  if (precision < 0.75 && recall > 0.85) return "Broad but unstable learning";
  if (precision > 0.85 && recall > 0.85) return "Balanced intelligence";
  return "Moderate adaptive behavior";
}

function getIntelligenceSummary(latest, previous) {
  if (!latest) return "No intelligence summary available yet.";
  if (!previous)
    return "This model has entered its first measurable intelligence state.";

  const latestAcc = Number(latest.accuracy || 0);
  const prevAcc = Number(previous.accuracy || 0);
  const latestPrecision = Number(latest.precision || 0);
  const latestRecall = Number(latest.recall || 0);

  if (latestAcc > prevAcc && latestPrecision > 0.85 && latestRecall > 0.85) {
    return "The model is showing strong adaptive behavior with improved confidence, trust, and stable learning balance.";
  }

  if (latestAcc > prevAcc) {
    return "The model is learning positively and its latest intelligence state reflects measurable improvement.";
  }

  if (latestAcc < prevAcc) {
    return "The model shows signs of performance instability. Further training refinement may be required.";
  }

  return "The model remains relatively stable with no major intelligence shift detected.";
}

export default DashboardPage;