import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getVersions } from "../services/api";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import InfoBox from "../components/InfoBox";
import { getModelMeta } from "../utils/modelMeta";

function ComparePage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");

  const { modelId = "logistic-regression" } = useParams();
  const location = useLocation();

  const isAI = location.pathname.startsWith("/ai");
  const model = getModelMeta(modelId);

  useEffect(() => {
    loadVersions();
    window.scrollTo(0, 0);
  }, [modelId, isAI]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(modelId);
      const safeData = Array.isArray(data) ? data : [];
      setVersions(safeData);

      if (safeData.length >= 2) {
        setSelectedA(safeData[safeData.length - 1].version_id);
        setSelectedB(safeData[safeData.length - 2].version_id);
      } else if (safeData.length === 1) {
        setSelectedA(safeData[0].version_id);
      }
    } catch (error) {
      console.error("Compare load error:", error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const versionA = useMemo(
    () => versions.find((v) => v.version_id === selectedA),
    [versions, selectedA]
  );

  const versionB = useMemo(
    () => versions.find((v) => v.version_id === selectedB),
    [versions, selectedB]
  );

  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    return Number.isNaN(num) ? value : num.toFixed(4);
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const metricComparison = isAI
    ? [
        { label: "Confidence", key: "accuracy" },
        { label: "Trust Score", key: "precision" },
        { label: "Stability", key: "recall" },
      ]
    : [
        { label: "Accuracy", key: "accuracy" },
        { label: "Precision", key: "precision" },
        { label: "Recall", key: "recall" },
      ];

  const compareIntelligence = useMemo(() => {
    if (!versionA || !versionB) return null;

    return {
      accuracyWinner: getMetricWinner(versionA.accuracy, versionB.accuracy, isAI),
      precisionWinner: getMetricWinner(versionA.precision, versionB.precision, isAI),
      recallWinner: getMetricWinner(versionA.recall, versionB.recall, isAI),

      accuracyDiff: getMetricDifference(versionA.accuracy, versionB.accuracy),
      precisionDiff: getMetricDifference(versionA.precision, versionB.precision),
      recallDiff: getMetricDifference(versionA.recall, versionB.recall),

      datasetChanged:
        (versionA.dataset_hash || "") !== (versionB.dataset_hash || ""),
      experimentChanged:
        (versionA.experiment_note || "").trim() !==
        (versionB.experiment_note || "").trim(),
      codeSummaryChanged:
        (versionA.code_change_summary || "").trim() !==
        (versionB.code_change_summary || "").trim(),
    };
  }, [versionA, versionB, isAI]);

  const sameSelection = selectedA && selectedB && selectedA === selectedB;

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Comparison Engine" : model.badge}
        </div>

        <PageHeader
          title={`${model.name} ${isAI ? "Intelligence Comparator" : "Version Compare"}`}
          subtitle={
            isAI
              ? `Compare two ${model.name} intelligence states across trust, confidence, stability, and adaptive evolution signals.`
              : `Compare two ${model.name} versions across performance, experiment changes, and blockchain-backed lineage intelligence.`
          }
        />
      </div>

      {/* STATES */}
      {loading ? (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? "Loading intelligence comparison..."
              : "Loading comparison intelligence..."}
          </p>
        </div>
      ) : versions.length < 2 ? (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? `At least two ${model.name} intelligence versions are required for AI comparison.`
              : `At least two ${model.name} versions are required to perform a comparison.`}
          </p>
        </div>
      ) : (
        <>
          {/* VERSION SELECT */}
          <SectionCard
            title={isAI ? "Intelligence Selection" : "Version Selection"}
          >
            <div className="compare-select-grid">
              <div>
                <label className="info-label compare-label">
                  {isAI ? "Select Intelligence A" : "Select Version A"}
                </label>
                <select
                  className="select-control"
                  value={selectedA}
                  onChange={(e) => setSelectedA(e.target.value)}
                >
                  {versions.map((v) => (
                    <option key={v.version_id} value={v.version_id}>
                      {v.version_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="info-label compare-label">
                  {isAI ? "Select Intelligence B" : "Select Version B"}
                </label>
                <select
                  className="select-control"
                  value={selectedB}
                  onChange={(e) => setSelectedB(e.target.value)}
                >
                  {versions.map((v) => (
                    <option key={v.version_id} value={v.version_id}>
                      {v.version_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {sameSelection && (
              <div className="info-box" style={{ marginTop: "18px" }}>
                <p className="info-label">Selection Warning</p>
                <div className="info-value">
                  Please choose two different {isAI ? "intelligence states" : "versions"} for a meaningful comparison.
                </div>
              </div>
            )}
          </SectionCard>

          {!sameSelection && (
            <>
              {/* QUICK SUMMARY */}
              <SectionCard
                title={isAI ? "Comparison Snapshot" : "Comparison Snapshot"}
              >
                <div className="info-grid">
                  <InfoBox
                    label={isAI ? "Dominant Intelligence" : "Better Version"}
                    value={getOverallWinner(compareIntelligence, isAI)}
                  />
                  <InfoBox
                    label={isAI ? "Confidence Gap" : "Accuracy Gap"}
                    value={formatDelta(compareIntelligence?.accuracyDiff)}
                  />
                  <InfoBox
                    label={isAI ? "Trust Gap" : "Precision Gap"}
                    value={formatDelta(compareIntelligence?.precisionDiff)}
                  />
                  <InfoBox
                    label={isAI ? "Drift Signal" : "Audit Difference"}
                    value={getComparisonInsight(compareIntelligence, isAI)}
                  />
                </div>
              </SectionCard>

              {/* HEADER CARDS */}
              <div className="compare-header-grid">
                <VersionHeaderCard
                  version={versionA}
                  title={isAI ? "Intelligence A" : "Version A"}
                  modelName={model.name}
                  isAI={isAI}
                />
                <VersionHeaderCard
                  version={versionB}
                  title={isAI ? "Intelligence B" : "Version B"}
                  modelName={model.name}
                  isAI={isAI}
                />
              </div>

              {/* INTELLIGENCE */}
              <SectionCard
                title={isAI ? "AI Comparison Intelligence" : "Comparison Intelligence"}
              >
                {!compareIntelligence ? (
                  <div className="info-box">
                    <p className="info-label">Comparison Status</p>
                    <div className="info-value">
                      Unable to compare selected {isAI ? "intelligence states" : "versions"}.
                    </div>
                  </div>
                ) : (
                  <div className="version-detail-stack">
                    <div className="info-grid">
                      <InfoBox
                        label={isAI ? "Confidence Winner" : "Accuracy Winner"}
                        value={compareIntelligence.accuracyWinner}
                      />
                      <InfoBox
                        label={isAI ? "Trust Winner" : "Precision Winner"}
                        value={compareIntelligence.precisionWinner}
                      />
                      <InfoBox
                        label={isAI ? "Stability Winner" : "Recall Winner"}
                        value={compareIntelligence.recallWinner}
                      />
                      <InfoBox
                        label={isAI ? "AI Verdict" : "Overall Verdict"}
                        value={getOverallWinner(compareIntelligence, isAI)}
                      />
                    </div>

                    <div className="info-grid">
                      <InfoBox
                        label={isAI ? "Knowledge Drift" : "Dataset Consistency"}
                        value={
                          compareIntelligence.datasetChanged
                            ? isAI
                              ? "Shifted"
                              : "Different"
                            : isAI
                            ? "Stable"
                            : "Same"
                        }
                      />
                      <InfoBox
                        label={isAI ? "Learning Notes" : "Experiment Notes"}
                        value={
                          compareIntelligence.experimentChanged
                            ? "Different"
                            : "Same"
                        }
                      />
                      <InfoBox
                        label={isAI ? "Behavior Logic" : "Code Changes"}
                        value={
                          compareIntelligence.codeSummaryChanged
                            ? "Different"
                            : "Same"
                        }
                      />
                      <InfoBox
                        label={isAI ? "Insight Summary" : "Insight"}
                        value={getComparisonInsight(compareIntelligence, isAI)}
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* METRICS */}
              <SectionCard
                title={isAI ? "Intelligence Metrics Comparison" : "Performance Comparison"}
              >
                <div className="info-grid">
                  {metricComparison.map((metric) => (
                    <CompareMetricBox
                      key={metric.key}
                      label={metric.label}
                      valueA={versionA?.[metric.key]}
                      valueB={versionB?.[metric.key]}
                      formatter={formatMetric}
                      isAI={isAI}
                    />
                  ))}
                </div>
              </SectionCard>

              {/* DETAILS */}
              <div className="compare-detail-grid">
                <DetailedCompareCard
                  title={versionA?.version_id || (isAI ? "Intelligence A" : "Version A")}
                  version={versionA}
                  formatDate={formatDate}
                  formatMetric={formatMetric}
                  isAI={isAI}
                />

                <DetailedCompareCard
                  title={versionB?.version_id || (isAI ? "Intelligence B" : "Version B")}
                  version={versionB}
                  formatDate={formatDate}
                  formatMetric={formatMetric}
                  isAI={isAI}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function VersionHeaderCard({ title, version, modelName, isAI }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <h2 className="stat-value">{version?.version_id || "N/A"}</h2>
      <p className="compare-card-subtext">
        {isAI
          ? "Adaptive Intelligence Snapshot"
          : version?.model_type || modelName}
      </p>
    </div>
  );
}

function CompareMetricBox({ label, valueA, valueB, formatter, isAI }) {
  const winner = getMetricWinner(valueA, valueB, isAI);
  const difference = getMetricDifference(valueA, valueB);

  return (
    <div className="info-box">
      <p className="info-label">{label}</p>
      <div className="compare-metric-stack">
        <div className="info-value">A: {formatter(valueA)}</div>
        <div className="info-value">B: {formatter(valueB)}</div>
        <div className="compare-better-text">Better: {winner}</div>
        <div className="compare-better-text">Difference: {formatDelta(difference)}</div>
      </div>
    </div>
  );
}

function DetailedCompareCard({
  title,
  version,
  formatDate,
  formatMetric,
  isAI,
}) {
  return (
    <SectionCard title={title}>
      <div className="info-grid">
        <InfoBox
          label={isAI ? "Confidence" : "Accuracy"}
          value={formatMetric(version?.accuracy)}
        />
        <InfoBox
          label={isAI ? "Trust Score" : "Precision"}
          value={formatMetric(version?.precision)}
        />
        <InfoBox
          label={isAI ? "Stability" : "Recall"}
          value={formatMetric(version?.recall)}
        />
        <InfoBox
          label={isAI ? "Previous Intelligence" : "Previous Version"}
          value={version?.previous_version || "None"}
        />
        <InfoBox
          label={isAI ? "Learning Timestamp" : "Training Time"}
          value={formatDate(version?.training_time)}
        />
        <InfoBox
          label={isAI ? "Intelligence Type" : "Model Type"}
          value={version?.model_type || "N/A"}
        />
        <InfoBox
          label={isAI ? "Knowledge Source" : "Dataset Name"}
          value={version?.dataset_name || "N/A"}
        />
        <InfoBox
          label={isAI ? "Knowledge Signature" : "Dataset Hash"}
          value={version?.dataset_hash || "N/A"}
        />
      </div>

      <div className="version-detail-stack compare-detail-stack">
        <InfoBox
          label={isAI ? "Learning Note" : "Experiment Note"}
          value={version?.experiment_note || "No experiment note available"}
        />

        <InfoBox
          label={isAI ? "Behavior Change Summary" : "Code Change Summary"}
          value={
            version?.code_change_summary ||
            "No code change summary available"
          }
        />

        <div className="info-box code-snippet-box">
          <p className="info-label">
            {isAI ? "Decision Logic Snapshot" : "Code Snippet"}
          </p>
          <pre className="code-snippet-pre">
            {version?.code_snippet || "No code snippet available"}
          </pre>
        </div>
      </div>
    </SectionCard>
  );
}

function getMetricWinner(a, b, isAI = false) {
  const valA = Number(a ?? 0);
  const valB = Number(b ?? 0);

  const labelA = isAI ? "Intelligence A" : "Version A";
  const labelB = isAI ? "Intelligence B" : "Version B";

  if (valA > valB) return labelA;
  if (valB > valA) return labelB;
  return "Equal";
}

function getMetricDifference(a, b) {
  const valA = Number(a ?? 0);
  const valB = Number(b ?? 0);
  return valA - valB;
}

function formatDelta(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  const num = Number(value);
  const formatted = Math.abs(num).toFixed(4);

  if (num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return "0.0000";
}

function getOverallWinner(compare, isAI) {
  if (!compare) return "N/A";

  const labelA = isAI ? "Intelligence A" : "Version A";
  const labelB = isAI ? "Intelligence B" : "Version B";

  const winners = [
    compare.accuracyWinner,
    compare.precisionWinner,
    compare.recallWinner,
  ];

  const countA = winners.filter((w) => w === labelA).length;
  const countB = winners.filter((w) => w === labelB).length;

  if (countA > countB) {
    return isAI
      ? "Intelligence A demonstrates stronger overall behavior"
      : "Version A performs better overall";
  }

  if (countB > countA) {
    return isAI
      ? "Intelligence B demonstrates stronger overall behavior"
      : "Version B performs better overall";
  }

  return isAI
    ? "Both intelligence states are closely matched"
    : "Both versions are closely matched";
}

function getComparisonInsight(compare, isAI) {
  if (!compare) return "No insight available";

  const changes = [
    compare.datasetChanged,
    compare.experimentChanged,
    compare.codeSummaryChanged,
  ].filter(Boolean).length;

  if (changes === 3) {
    return isAI
      ? "Major intelligence divergence detected"
      : "Major experimental divergence detected";
  }

  if (changes === 2) {
    return isAI
      ? "Moderate adaptive variation observed"
      : "Moderate experimental variation";
  }

  if (changes === 1) {
    return isAI
      ? "Minor intelligence drift detected"
      : "Minor experimental difference";
  }

  return isAI
    ? "Nearly identical intelligence configuration"
    : "Nearly identical experiment configuration";
}

export default ComparePage;