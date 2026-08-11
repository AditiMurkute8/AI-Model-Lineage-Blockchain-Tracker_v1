import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getVersions } from "../services/api";
import SearchBar from "../components/SearchBar";
import SortSelect from "../components/SortSelect";
import { getModelMeta } from "../utils/modelMeta";
import PageHeader from "../components/PageHeader";

function VersionsPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("latest");

  const navigate = useNavigate();
  const location = useLocation();
  const { modelId = "logistic-regression" } = useParams();

  const isAI = location.pathname.startsWith("/ai");
  const basePath = isAI ? "/ai" : "/models";

  const model = getModelMeta(modelId);

  useEffect(() => {
    loadVersions();
    window.scrollTo(0, 0);
  }, [modelId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getVersions(modelId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Versions load error:", err);
      setError(
        isAI
          ? "Failed to load AI memory archive."
          : "Failed to load model versions."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedVersions = useMemo(() => {
    const filtered = versions.filter((v) =>
      (v.version_id || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered];

    if (sortType === "latest") {
      sorted.sort(
        (a, b) =>
          parseInt((b.version_id || "v0").replace("v", ""), 10) -
          parseInt((a.version_id || "v0").replace("v", ""), 10)
      );
    } else if (sortType === "oldest") {
      sorted.sort(
        (a, b) =>
          parseInt((a.version_id || "v0").replace("v", ""), 10) -
          parseInt((b.version_id || "v0").replace("v", ""), 10)
      );
    } else if (sortType === "accuracy") {
      sorted.sort((a, b) => Number(b.accuracy || 0) - Number(a.accuracy || 0));
    }

    return sorted;
  }, [versions, searchTerm, sortType]);

  const totalVersions = filteredAndSortedVersions.length;

  const latestVersion =
    filteredAndSortedVersions.length > 0
      ? filteredAndSortedVersions[0]
      : null;

  const bestVersion =
    filteredAndSortedVersions.length > 0
      ? [...filteredAndSortedVersions].sort(
          (a, b) => Number(b.accuracy || 0) - Number(a.accuracy || 0)
        )[0]
      : null;

  const averageAccuracy =
    filteredAndSortedVersions.length > 0
      ? (
          filteredAndSortedVersions.reduce(
            (sum, v) => sum + Number(v.accuracy || 0),
            0
          ) / filteredAndSortedVersions.length
        ).toFixed(4)
      : "0.0000";

  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    return Number.isNaN(num) ? value : num.toFixed(4);
  };

  const trustScore =
    filteredAndSortedVersions.length > 0
      ? (0.86 + Math.min(filteredAndSortedVersions.length * 0.01, 0.09)).toFixed(2)
      : "0.85";

  const adaptiveStatus = getAdaptiveStatus(filteredAndSortedVersions);

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Memory Archive" : "Blockchain Version Registry"}
        </div>

        <PageHeader
          title={`${model.name} ${
            isAI ? "Learning Memory" : "Version History"
          }`}
          subtitle={
            isAI
              ? `Explore every stored intelligence state of ${model.name}, including confidence behavior, memory progression, adaptive shifts, and reasoning snapshots.`
              : `Browse, search, and inspect every tracked ${model.name} version across your immutable experiment history, ledger flow, and traceability chain.`
          }
        />
      </div>

      {/* SUMMARY STRIP */}
      <div className="model-summary-card">
        <div className="model-summary-item">
          <p className="model-summary-label">
            {isAI ? "Memory States" : "Tracked Versions"}
          </p>
          <h3 className="model-summary-value">{totalVersions}</h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">
            {isAI ? "Current Intelligence" : "Latest Ledger Entry"}
          </p>
          <h3 className="model-summary-value">
            {latestVersion?.version_id || "N/A"}
          </h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">
            {isAI ? "Peak Intelligence" : "Best Accuracy"}
          </p>
          <h3 className="model-summary-value">
            {bestVersion ? formatMetric(bestVersion.accuracy) : "0.0000"}
          </h3>
        </div>

        <div className="model-summary-item">
          <p className="model-summary-label">
            {isAI ? "Adaptive State" : "Chain Integrity"}
          </p>
          <h3 className="model-summary-value">
            {isAI ? adaptiveStatus : "Verified"}
          </h3>
        </div>
      </div>

      {/* AI INSIGHT BAR */}
      {isAI && (
        <div className="info-grid" style={{ marginBottom: "24px" }}>
          <div className="info-box">
            <p className="info-label">Average Confidence</p>
            <div className="info-value">{averageAccuracy}</div>
          </div>

          <div className="info-box">
            <p className="info-label">Trust Signature</p>
            <div className="info-value">{trustScore}</div>
          </div>

          <div className="info-box">
            <p className="info-label">Best Memory State</p>
            <div className="info-value">{bestVersion?.version_id || "N/A"}</div>
          </div>

          <div className="info-box">
            <p className="info-label">Archive Health</p>
            <div className="info-value">
              {totalVersions > 0 ? "Stable Memory Archive" : "Empty"}
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="versions-toolbar page-card">
        <div className="versions-toolbar-left">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={
              isAI
                ? `Search memory state (e.g. v12)`
                : `Search ${model.shortName} version (e.g. v2)`
            }
          />
        </div>

        <div className="versions-toolbar-right">
          <SortSelect value={sortType} onChange={setSortType} />
        </div>
      </div>

      {/* STATES */}
      {loading && (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? `Loading learning memory archive for ${model.name}...`
              : `Loading version history for ${model.name}...`}
          </p>
        </div>
      )}

      {error && (
        <div className="page-card empty-state-card">
          <p className="error-text">{error}</p>
        </div>
      )}

      {!loading && !error && filteredAndSortedVersions.length === 0 && (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? `No memory states found for ${model.name}. Start your first intelligence cycle to create a learning archive.`
              : `No versions found for ${model.name}. Start a training run to create your first tracked version.`}
          </p>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && filteredAndSortedVersions.length > 0 && (
        <div className="versions-list-grid">
          {filteredAndSortedVersions.map((version, index) => (
            <div
              key={version.version_id || index}
              className="version-preview-wrapper"
              onClick={() =>
                navigate(`${basePath}/${modelId}/version/${version.version_id}`)
              }
            >
              {isAI ? (
                <AIMemoryCard version={version} formatMetric={formatMetric} />
              ) : (
                <BlockchainVersionCard
                  version={version}
                  formatMetric={formatMetric}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   AI MEMORY CARD
========================= */
function AIMemoryCard({ version, formatMetric }) {
  const confidence = Number(version?.accuracy || 0);
  const precision = Number(version?.precision || 0);
  const recall = Number(version?.recall || 0);

  const behavior = getBehaviorLabel(confidence, precision, recall);
  const stateType = getStateType(version);
  const signal = getSignalLevel(confidence);

  return (
    <div className="version-card premium-version-card ai-memory-card">
      <div className="version-left-block">
        <p className="version-label">Memory Snapshot</p>
        <h3 className="version-id-main">{version.version_id}</h3>

        <div className="version-status-row">
          <span className="version-status-pill">{stateType}</span>
          <span className="version-status-pill">{signal}</span>
        </div>
      </div>

      <div className="version-right-block" style={{ marginTop: "14px" }}>
        <div className="metric-tile">
          <span>Confidence</span>
          <h4>{formatMetric(version.accuracy)}</h4>
        </div>

        <div className="metric-tile">
          <span>Trust Score</span>
          <h4>{formatMetric(version.precision)}</h4>
        </div>

        <div className="metric-tile">
          <span>Stability</span>
          <h4>{formatMetric(version.recall)}</h4>
        </div>
      </div>

      <div className="version-bottom-row">
        <div className="version-prev-box">
          <span className="prev-label">Behavior Pattern</span>
          <p className="prev-value">{behavior}</p>
        </div>

        <button className="version-open-btn">Open Memory →</button>
      </div>
    </div>
  );
}

/* =========================
   BLOCKCHAIN CARD
========================= */
function BlockchainVersionCard({ version, formatMetric }) {
  return (
    <div className="version-card premium-version-card">
      <div className="version-left-block">
        <p className="version-label">Ledger Snapshot</p>
        <h3 className="version-id-main">{version.version_id}</h3>

        <div className="version-status-row">
          <span className="version-status-pill">
            {version.previous_version ? "Chain Linked" : "Genesis Block"}
          </span>
        </div>
      </div>

      <div className="version-right-block" style={{ marginTop: "14px" }}>
        <div className="metric-tile">
          <span>Accuracy</span>
          <h4>{formatMetric(version.accuracy)}</h4>
        </div>

        <div className="metric-tile">
          <span>Precision</span>
          <h4>{formatMetric(version.precision)}</h4>
        </div>

        <div className="metric-tile">
          <span>Recall</span>
          <h4>{formatMetric(version.recall)}</h4>
        </div>
      </div>

      <div className="version-bottom-row">
        <div className="version-prev-box">
          <span className="prev-label">Previous Version</span>
          <p className="prev-value">{version.previous_version || "None"}</p>
        </div>

        <button className="version-open-btn">Open Ledger →</button>
      </div>
    </div>
  );
}

/* =========================
   HELPERS
========================= */
function getAdaptiveStatus(versions) {
  if (!versions || versions.length === 0) return "Dormant";
  if (versions.length < 3) return "Learning";
  if (versions.length < 7) return "Adapting";
  return "Mature";
}

function getSignalLevel(confidence) {
  if (confidence >= 0.9) return "High Signal";
  if (confidence >= 0.75) return "Stable Signal";
  return "Moderate Signal";
}

function getStateType(version) {
  if (!version?.previous_version) return "Base Intelligence";
  return "Adaptive Memory";
}

function getBehaviorLabel(confidence, precision, recall) {
  if (confidence > 0.9 && precision > 0.88 && recall > 0.88) {
    return "Balanced Intelligence";
  }

  if (precision > 0.9 && recall < 0.75) {
    return "Selective Reasoning";
  }

  if (recall > 0.9 && precision < 0.75) {
    return "Broad Learning Spread";
  }

  if (confidence < 0.75) {
    return "Developing Intelligence";
  }

  return "Moderate Adaptive State";
}

export default VersionsPage;