import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getVersions } from "../services/api";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import InfoBox from "../components/InfoBox";
import MetricLineChart from "../components/MetricLineChart";
import { getModelMeta } from "../utils/modelMeta";

function AnalyticsPage() {
  const { modelId = "logistic-regression" } = useParams();
  const location = useLocation();
  const model = getModelMeta(modelId);

  const isAI = location.pathname.startsWith("/ai");

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
    window.scrollTo(0, 0);
  }, [modelId, isAI]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(modelId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Analytics load error:", error);
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

  const formatMetric = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    return Number.isNaN(num) ? value : num.toFixed(4);
  };

  const totalVersions = sortedVersions.length;

  const latestVersion =
    sortedVersions.length > 0
      ? sortedVersions[sortedVersions.length - 1]
      : null;

  const bestAccuracyVersion = useMemo(() => {
    if (sortedVersions.length === 0) return null;
    return [...sortedVersions].sort(
      (a, b) => Number(b.accuracy || 0) - Number(a.accuracy || 0)
    )[0];
  }, [sortedVersions]);

  const worstAccuracyVersion = useMemo(() => {
    if (sortedVersions.length === 0) return null;
    return [...sortedVersions].sort(
      (a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0)
    )[0];
  }, [sortedVersions]);

  const averageAccuracy =
    sortedVersions.length > 0
      ? (
          sortedVersions.reduce((sum, v) => sum + Number(v.accuracy || 0), 0) /
          sortedVersions.length
        ).toFixed(4)
      : "0.0000";

  const averageRecall =
    sortedVersions.length > 0
      ? (
          sortedVersions.reduce((sum, v) => sum + Number(v.recall || 0), 0) /
          sortedVersions.length
        ).toFixed(4)
      : "0.0000";

  const averagePrecision =
    sortedVersions.length > 0
      ? (
          sortedVersions.reduce(
            (sum, v) => sum + Number(v.precision || 0),
            0
          ) / sortedVersions.length
        ).toFixed(4)
      : "0.0000";

  const improvementFromFirst =
    sortedVersions.length > 1
      ? (
          Number(sortedVersions[sortedVersions.length - 1]?.accuracy || 0) -
          Number(sortedVersions[0]?.accuracy || 0)
        ).toFixed(4)
      : "0.0000";

  const performanceRange =
    sortedVersions.length > 0
      ? (
          Number(bestAccuracyVersion?.accuracy || 0) -
          Number(worstAccuracyVersion?.accuracy || 0)
        ).toFixed(4)
      : "0.0000";

  const consistencyScore = useMemo(() => {
    if (sortedVersions.length < 2) return "N/A";

    const values = sortedVersions.map((v) => Number(v.accuracy || 0));
    const avg =
      values.reduce((sum, val) => sum + val, 0) / values.length;

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;

    const stdDev = Math.sqrt(variance);

    if (stdDev < 0.01) return isAI ? "Highly Stable" : "Highly Consistent";
    if (stdDev < 0.03) return isAI ? "Moderately Stable" : "Moderately Consistent";
    return isAI ? "Volatile" : "Performance Volatile";
  }, [sortedVersions, isAI]);

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Analytics Engine" : model.badge}
        </div>

        <PageHeader
          title={`${model.name} ${isAI ? "Intelligence Analytics" : "Analytics"}`}
          subtitle={
            isAI
              ? `Track trust, confidence, stability, and intelligence progression across ${model.name} learning evolution.`
              : `Track metric evolution, identify your strongest model versions, and analyze performance progression across your experiment history.`
          }
        />
      </div>

      {/* STATES */}
      {loading ? (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? "Loading AI analytics intelligence..."
              : "Loading analytics intelligence..."}
          </p>
        </div>
      ) : sortedVersions.length === 0 ? (
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? `No AI analytics data available yet. Run your first ${model.name} intelligence cycle to unlock smart insights.`
              : `No analytics data available yet. Train your first ${model.name} version to unlock performance insights.`}
          </p>
        </div>
      ) : (
        <>
          {/* QUICK SNAPSHOT */}
          <SectionCard
            title={isAI ? "AI Analytics Snapshot" : "Analytics Snapshot"}
          >
            <div className="info-grid">
              <InfoBox
                label={isAI ? "Peak Intelligence" : "Best Version"}
                value={
                  bestAccuracyVersion
                    ? `${bestAccuracyVersion.version_id} (${formatMetric(
                        bestAccuracyVersion.accuracy
                      )})`
                    : "N/A"
                }
              />
              <InfoBox
                label={isAI ? "Drift Range" : "Performance Range"}
                value={performanceRange}
              />
              <InfoBox
                label={isAI ? "Stability Signal" : "Consistency Signal"}
                value={consistencyScore}
              />
              <InfoBox
                label={isAI ? "AI Health Verdict" : "Audit Verdict"}
                value={getEvolutionStatus(sortedVersions, isAI)}
              />
            </div>
          </SectionCard>

          {/* STATS */}
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">
                {isAI ? "Intelligence States" : "Total Versions"}
              </p>
              <h2 className="stat-value">{totalVersions}</h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">
                {isAI ? "Strongest Intelligence" : "Best Accuracy"}
              </p>
              <h2 className="stat-value">
                {bestAccuracyVersion?.version_id || "N/A"}
              </h2>
              <p className="analytics-card-subtext">
                {formatMetric(bestAccuracyVersion?.accuracy)}
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">
                {isAI ? "Latest Confidence" : "Latest Accuracy"}
              </p>
              <h2 className="stat-value">
                {formatMetric(latestVersion?.accuracy)}
              </h2>
              <p className="analytics-card-subtext">
                {latestVersion?.version_id || "N/A"}
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">
                {isAI ? "Avg Stability" : "Avg Recall"}
              </p>
              <h2 className="stat-value">{averageRecall}</h2>
            </div>
          </div>

          {/* CHARTS */}
          <SectionCard
            title={isAI ? "Intelligence Trend Charts" : "Performance Charts"}
          >
            <div className="charts-grid">
              <MetricLineChart
                title={isAI ? "Confidence Trend" : "Accuracy Trend"}
                dataKey="accuracy"
                versions={sortedVersions}
              />

              <MetricLineChart
                title={isAI ? "Trust Score Trend" : "Precision Trend"}
                dataKey="precision"
                versions={sortedVersions}
              />

              <MetricLineChart
                title={isAI ? "Stability Trend" : "Recall Trend"}
                dataKey="recall"
                versions={sortedVersions}
              />
            </div>
          </SectionCard>

          {/* SMART INSIGHTS */}
          <SectionCard title={isAI ? "AI Smart Insights" : "Smart Insights"}>
            <div className="info-grid">
              <InfoBox
                label={isAI ? "Best Intelligence State" : "Best Performing Version"}
                value={
                  bestAccuracyVersion
                    ? `${bestAccuracyVersion.version_id} (${formatMetric(
                        bestAccuracyVersion.accuracy
                      )})`
                    : "N/A"
                }
              />

              <InfoBox
                label={isAI ? "Weakest Intelligence State" : "Weakest Version"}
                value={
                  worstAccuracyVersion
                    ? `${worstAccuracyVersion.version_id} (${formatMetric(
                        worstAccuracyVersion.accuracy
                      )})`
                    : "N/A"
                }
              />

              <InfoBox
                label={isAI ? "Average Confidence" : "Average Accuracy"}
                value={averageAccuracy}
              />

              <InfoBox
                label={isAI ? "Intelligence Trend" : "Overall Trend"}
                value={getTrendSummary(sortedVersions, isAI)}
              />
            </div>
          </SectionCard>

          {/* ANALYTICS INTELLIGENCE */}
          <SectionCard
            title={isAI ? "AI Health Intelligence" : "Analytics Intelligence"}
          >
            <div className="info-grid">
              <InfoBox
                label={isAI ? "Average Trust Score" : "Average Precision"}
                value={averagePrecision}
              />

              <InfoBox
                label={isAI ? "Average Stability" : "Average Recall"}
                value={averageRecall}
              />

              <InfoBox
                label={isAI ? "Confidence Shift" : "Accuracy Shift"}
                value={formatDelta(improvementFromFirst, isAI)}
              />

              <InfoBox
                label={isAI ? "AI Health Status" : "Model Evolution Status"}
                value={getEvolutionStatus(sortedVersions, isAI)}
              />
            </div>
          </SectionCard>

          {/* BREAKDOWN */}
          <SectionCard
            title={
              isAI
                ? "Intelligence State Breakdown"
                : "Version Performance Breakdown"
            }
          >
            <div className="analytics-breakdown-grid">
              {sortedVersions.map((version, index) => (
                <div key={version.version_id || index} className="breakdown-row">
                  <div>
                    <p className="info-label">
                      {isAI ? "State" : "Version"}
                    </p>
                    <div className="info-value">{version.version_id}</div>
                  </div>

                  <div>
                    <p className="info-label">
                      {isAI ? "Confidence" : "Accuracy"}
                    </p>
                    <div className="info-value">
                      {formatMetric(version.accuracy)}
                    </div>
                  </div>

                  <div>
                    <p className="info-label">
                      {isAI ? "Trust Score" : "Precision"}
                    </p>
                    <div className="info-value">
                      {formatMetric(version.precision)}
                    </div>
                  </div>

                  <div>
                    <p className="info-label">
                      {isAI ? "Stability" : "Recall"}
                    </p>
                    <div className="info-value">
                      {formatMetric(version.recall)}
                    </div>
                  </div>

                  <div>
                    <p className="info-label">
                      {isAI ? "Previous State" : "Previous Version"}
                    </p>
                    <div className="info-value">
                      {version.previous_version || "None"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function getTrendSummary(versions, isAI = false) {
  if (!versions || versions.length < 2) {
    return isAI ? "Not enough intelligence history" : "Not enough data";
  }

  const first = Number(versions[0]?.accuracy || 0);
  const last = Number(versions[versions.length - 1]?.accuracy || 0);

  if (last > first) {
    return isAI ? "Intelligence improving over time" : "Improving over time";
  }

  if (last < first) {
    return isAI ? "Intelligence weakening over time" : "Declining over time";
  }

  return isAI ? "Stable intelligence behavior" : "Stable overall";
}

function formatDelta(value, isAI = false) {
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";

  const formatted = Math.abs(num).toFixed(4);

  if (num > 0) {
    return isAI ? `+${formatted} stronger` : `+${formatted} improvement`;
  }

  if (num < 0) {
    return isAI ? `-${formatted} weaker` : `-${formatted} decline`;
  }

  return isAI ? "0.0000 stable intelligence" : "0.0000 stable";
}

function getEvolutionStatus(versions, isAI = false) {
  if (!versions || versions.length < 2) {
    return isAI
      ? "Insufficient intelligence history"
      : "Insufficient version history";
  }

  const first = Number(versions[0]?.accuracy || 0);
  const last = Number(versions[versions.length - 1]?.accuracy || 0);
  const best = Math.max(...versions.map((v) => Number(v.accuracy || 0)));

  if (last === best && last > first) {
    return isAI
      ? "AI currently operating at peak intelligence"
      : "Currently at peak performance";
  }

  if (last > first) {
    return isAI ? "AI intelligence is improving" : "Model is improving";
  }

  if (last < first) {
    return isAI
      ? "Recent intelligence regression detected"
      : "Recent performance regression";
  }

  return isAI
    ? "AI behavior is currently stable"
    : "Model performance is stable";
}

export default AnalyticsPage;