import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getVersionById, getVersions } from "../services/api";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import InfoBox from "../components/InfoBox";
import { getModelMeta } from "../utils/modelMeta";
import VersionBadge from "../components/VersionBadge";
import { getVersionBadges } from "../utils/versionBadges";

function VersionDetailPage() {
  const { modelId = "logistic-regression", versionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isAI = location.pathname.startsWith("/ai");
  const basePath = isAI ? "/ai" : "/models";

  const model = getModelMeta(modelId);

  const [version, setVersion] = useState(null);
  const [allVersions, setAllVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (versionId) {
      loadVersionDetails();
      window.scrollTo(0, 0);
    }
  }, [modelId, versionId]);

  const loadVersionDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [versionData, versionsData] = await Promise.all([
        getVersionById(modelId, versionId),
        getVersions(modelId),
      ]);

      if (!versionData) {
        setError(isAI ? "Intelligence snapshot not found." : "Version not found.");
        setVersion(null);
      } else {
        setVersion(versionData);
      }

      setAllVersions(Array.isArray(versionsData) ? versionsData : []);
    } catch (err) {
      console.error("Version detail load error:", err);
      setError(
        isAI
          ? "Failed to load intelligence snapshot."
          : "Failed to load version details."
      );
    } finally {
      setLoading(false);
    }
  };

  const sortedVersions = useMemo(() => {
    return [...allVersions].sort(
      (a, b) =>
        parseInt((a.version_id || "v0").replace("v", ""), 10) -
        parseInt((b.version_id || "v0").replace("v", ""), 10)
    );
  }, [allVersions]);

  const currentIndex = sortedVersions.findIndex(
    (v) =>
      (v.version_id || "").toLowerCase() ===
      (versionId || "").toLowerCase()
  );

  const previousVersionObj =
    currentIndex > 0 ? sortedVersions[currentIndex - 1] : null;

  const nextVersionObj =
    currentIndex >= 0 && currentIndex < sortedVersions.length - 1
      ? sortedVersions[currentIndex + 1]
      : null;

  const evolution = useMemo(() => {
    if (!version || !previousVersionObj) return null;

    return {
      accuracyChange: getMetricChange(
        version.accuracy,
        previousVersionObj.accuracy
      ),
      precisionChange: getMetricChange(
        version.precision,
        previousVersionObj.precision
      ),
      recallChange: getMetricChange(
        version.recall,
        previousVersionObj.recall
      ),
      datasetChanged:
        (version.dataset_hash || "") !==
        (previousVersionObj.dataset_hash || ""),
      experimentChanged:
        (version.experiment_note || "").trim() !==
        (previousVersionObj.experiment_note || "").trim(),
      codeSummaryChanged:
        (version.code_change_summary || "").trim() !==
        (previousVersionObj.code_change_summary || "").trim(),
    };
  }, [version, previousVersionObj]);

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

  const getVersionNumber = (v) =>
    parseInt((v || "v0").replace("v", ""), 10) || 0;

  const getAISignal = () => {
    const confidence = Number(version?.accuracy || 0);
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.75) return "Stable";
    return "Moderate";
  };

  const getTrustScore = () => {
    const precision = Number(version?.precision || 0);
    return precision ? precision.toFixed(4) : "N/A";
  };

  const getIntelligenceSummary = () => {
    if (!evolution) return "Initial intelligence baseline established";

    const improvedCount = [
      evolution.accuracyChange > 0,
      evolution.precisionChange > 0,
      evolution.recallChange > 0,
    ].filter(Boolean).length;

    if (improvedCount === 3)
      return "This intelligence snapshot shows strong adaptive improvement.";
    if (improvedCount === 2)
      return "This model evolved with moderate intelligence gains.";
    if (improvedCount === 1)
      return "This version reflects partial learning refinement.";
    return "This snapshot shows limited intelligence improvement.";
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-card empty-state-card">
          <p className="loading-text">
            {isAI
              ? "Loading intelligence snapshot..."
              : "Loading version intelligence..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="page-wrapper">
        <button
          onClick={() => navigate(`${basePath}/${modelId}/versions`)}
          className="secondary-button"
          style={{ marginBottom: "24px" }}
        >
          Back to {isAI ? "AI Evolution" : "Versions"}
        </button>

        <div className="error-box">{error || "Version not found."}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div className="model-hero">
        <div className="model-hero-badge">
          {isAI ? "AI Intelligence Snapshot" : model.badge}
        </div>

        <PageHeader
          title={`${model.name} • ${version.version_id || "Unknown Version"}`}
          subtitle={
            isAI
              ? "Detailed intelligence snapshot including trust, confidence behavior, adaptive evolution, learning interpretation, and recommended next actions."
              : "Detailed version intelligence, experiment context, model metadata, performance metrics, lineage navigation, and deployment guidance."
          }
        />
      </div>

      {/* TOP STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Evolution Step" : "Version Number"}
          </p>
          <h2 className="stat-value">
            {getVersionNumber(version.version_id)}
          </h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Signal Strength" : "Model Type"}
          </p>
          <h2 className="stat-value">
            {isAI ? getAISignal() : version.model_type || model.name}
          </h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Trust Score" : "Accuracy"}
          </p>
          <h2 className="stat-value">
            {isAI ? getTrustScore() : formatMetric(version.accuracy)}
          </h2>
        </div>

        <div className="stat-card">
          <p className="stat-label">
            {isAI ? "Snapshot Time" : "Training Time"}
          </p>
          <h2 className="stat-value">{formatDate(version.training_time || version.training_timestamp || version.created_at)}</h2>
        </div>
      </div>

      {/* EVOLUTION */}
      <SectionCard title={isAI ? "Intelligence Evolution" : "Evolution Intelligence"}>
        {!previousVersionObj ? (
          <div className="info-box">
            <p className="info-label">
              {isAI ? "Intelligence Status" : "Evolution Status"}
            </p>
            <div className="info-value">
              {isAI
                ? "This is the first intelligence snapshot, so no adaptive comparison is available yet."
                : "This is the first tracked version, so no historical comparison is available yet."}
            </div>
          </div>
        ) : (
          <div className="version-detail-stack">
            <div className="info-grid">
              <InfoBox
                label="Compared Against"
                value={previousVersionObj.version_id || "N/A"}
              />
              <InfoBox
                label={isAI ? "Confidence Shift" : "Accuracy Change"}
                value={formatDelta(evolution?.accuracyChange)}
              />
              <InfoBox
                label={isAI ? "Trust Shift" : "Precision Change"}
                value={formatDelta(evolution?.precisionChange)}
              />
              <InfoBox
                label={isAI ? "Stability Shift" : "Recall Change"}
                value={formatDelta(evolution?.recallChange)}
              />
            </div>

            <div className="info-grid">
              <InfoBox
                label={isAI ? "Data Context Changed" : "Dataset Hash Changed"}
                value={evolution?.datasetChanged ? "Yes" : "No"}
              />
              <InfoBox
                label={isAI ? "Prompt Context Changed" : "Experiment Note Changed"}
                value={evolution?.experimentChanged ? "Yes" : "No"}
              />
              <InfoBox
                label={isAI ? "Logic Summary Changed" : "Code Summary Changed"}
                value={evolution?.codeSummaryChanged ? "Yes" : "No"}
              />
              <InfoBox
                label={isAI ? "Intelligence Summary" : "Overall Evolution"}
                value={
                  isAI
                    ? getIntelligenceSummary()
                    : getEvolutionSummary(evolution)
                }
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* MODEL INFO */}
      <SectionCard title={isAI ? "Snapshot Metadata" : "Model Information"}>
        <div className="info-grid">
          <InfoBox label="Model ID" value={version.model_id || "N/A"} />
          <InfoBox
            label={isAI ? "Previous Intelligence" : "Previous Version"}
            value={version.previous_version || "None"}
          />
          <InfoBox label="Dataset Name" value={version.dataset_name || "N/A"} />
          <InfoBox label="Dataset Hash" value={version.dataset_hash || "N/A"} />
        </div>
      </SectionCard>

      {/* PERFORMANCE */}
      <SectionCard title={isAI ? "Intelligence Signals" : "Performance Metrics"}>
        <div className="info-grid">
          <InfoBox
            label={isAI ? "Confidence" : "Accuracy"}
            value={formatMetric(version.accuracy)}
          />
          <InfoBox
            label={isAI ? "Trust Score" : "Precision"}
            value={formatMetric(version.precision)}
          />
          <InfoBox
            label={isAI ? "Stability" : "Recall"}
            value={formatMetric(version.recall)}
          />
        </div>
      </SectionCard>

      {/* EXPLAIN THIS VERSION */}
      <SectionCard title={isAI ? "AI Reasoning Engine" : "Version Explanation Engine"}>
        <div className="version-detail-stack">
          <InfoBox
            label={isAI ? "Intelligence Summary" : "Version Summary"}
            value={getVersionNarrative(version, previousVersionObj, evolution, isAI)}
          />

          <InfoBox
            label={isAI ? "Risk Assessment" : "Deployment Risk"}
            value={getRiskAssessment(version, evolution, isAI)}
          />

          <InfoBox
            label={isAI ? "Behavior Insight" : "Behavior Interpretation"}
            value={getBehaviorInsight(version, evolution, isAI)}
          />

          <div className="info-box">
            <p className="info-label">
              {isAI ? "Why This Intelligence Changed" : "Possible Reasons Behind This Version"}
            </p>

            <div className="info-value" style={{ whiteSpace: "normal" }}>
              <ul style={{ margin: "0", paddingLeft: "18px" }}>
                {getPossibleReasons(version, previousVersionObj, evolution, isAI).map(
                  (reason, index) => (
                    <li key={index} style={{ marginBottom: "10px" }}>
                      {reason}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* RECOMMENDATION ENGINE */}
      <SectionCard title={isAI ? "AI Recommendation Engine" : "Release Recommendation Engine"}>
        <div className="info-grid">
          <InfoBox
            label={isAI ? "Recommended Action" : "Recommended Action"}
            value={getRecommendedAction(version, evolution, isAI)}
          />
          <InfoBox
            label={isAI ? "Readiness Status" : "Release Readiness"}
            value={getReleaseReadiness(version, evolution, isAI)}
          />
          <InfoBox
            label={isAI ? "Optimization Focus" : "Optimization Focus"}
            value={getOptimizationFocus(version, evolution, isAI)}
          />
          <InfoBox
            label={isAI ? "Suggested Next Step" : "Suggested Next Step"}
            value={getSuggestedNextStep(version, evolution, isAI)}
          />
        </div>
      </SectionCard>

      {/* EXPERIMENT DETAILS */}
      <SectionCard title={isAI ? "Intelligence Context" : "Experiment Details"}>
        <div className="version-detail-stack">
          <InfoBox
            label={isAI ? "Learning Note" : "Experiment Note"}
            value={version.experiment_note || "No experiment note available"}
          />

          <InfoBox
            label={isAI ? "Logic Change Summary" : "Code Change Summary"}
            value={
              version.code_change_summary || "No code change summary available"
            }
          />

          <div className="info-box code-snippet-box">
            <p className="info-label">
              {isAI ? "Intelligence Logic Snapshot" : "Code Snippet"}
            </p>
            <pre className="code-snippet-pre">
              {version.code_snippet || "No code snippet available"}
            </pre>
          </div>
        </div>
      </SectionCard>

      {/* NAVIGATION */}
      <SectionCard title={isAI ? "Evolution Navigation" : "Version Navigation"}>
        <div className="version-nav-grid">
          <NavCard
            title={isAI ? "Previous Intelligence" : "Previous Version"}
            versionId={previousVersionObj?.version_id}
            disabled={!previousVersionObj}
            onClick={() =>
              previousVersionObj &&
              navigate(
                `${basePath}/${modelId}/version/${previousVersionObj.version_id}`
              )
            }
          />

          <NavCard
            title={isAI ? "Next Intelligence" : "Next Version"}
            versionId={nextVersionObj?.version_id}
            disabled={!nextVersionObj}
            onClick={() =>
              nextVersionObj &&
              navigate(`${basePath}/${modelId}/version/${nextVersionObj.version_id}`)
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}

function getMetricChange(current, previous) {
  const curr = Number(current ?? 0);
  const prev = Number(previous ?? 0);
  return curr - prev;
}

function formatDelta(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  const formatted = Math.abs(value).toFixed(4);

  if (value > 0) return `+${formatted} (Improved)`;
  if (value < 0) return `-${formatted} (Dropped)`;
  return `0.0000 (No Change)`;
}

function getEvolutionSummary(evolution) {
  if (!evolution) return "No evolution data";

  const improvedCount = [
    evolution.accuracyChange > 0,
    evolution.precisionChange > 0,
    evolution.recallChange > 0,
  ].filter(Boolean).length;

  if (improvedCount === 3) return "Strong overall improvement";
  if (improvedCount === 2) return "Moderate improvement";
  if (improvedCount === 1) return "Mixed performance shift";
  return "No metric improvement detected";
}

function getVersionNarrative(version, previousVersion, evolution, isAI = false) {
  if (!version) return "No explanation available.";

  if (!previousVersion || !evolution) {
    return isAI
      ? "This is the first recorded intelligence snapshot, so no adaptive reasoning comparison is available yet."
      : "This is the first recorded version, so no historical performance interpretation is available yet.";
  }

  const acc = evolution.accuracyChange;
  const prec = evolution.precisionChange;
  const rec = evolution.recallChange;

  const improved = [acc > 0, prec > 0, rec > 0].filter(Boolean).length;
  const dropped = [acc < 0, prec < 0, rec < 0].filter(Boolean).length;

  if (isAI) {
    if (improved === 3) {
      return "This intelligence state shows strong adaptive growth across confidence, trust, and stability. The model appears to have learned effectively from the previous state.";
    }

    if (improved === 2) {
      return "This intelligence version demonstrates noticeable improvement with moderate behavioral refinement. Most signals indicate smarter prediction behavior.";
    }

    if (improved === 1 && dropped === 0) {
      return "This intelligence state shows limited but positive learning refinement. Improvement exists, but evolution remains conservative.";
    }

    if (dropped >= 2) {
      return "This intelligence snapshot suggests regression in adaptive quality. The model may have become less reliable after recent changes.";
    }

    return "This intelligence state reflects mixed learning behavior with trade-offs between confidence, trust, and stability.";
  }

  if (improved === 3) {
    return "This version shows strong overall model improvement across all major performance metrics, indicating a successful experimental update.";
  }

  if (improved === 2) {
    return "This version improved in most performance areas and appears to be a meaningful upgrade over the previous tracked version.";
  }

  if (improved === 1 && dropped === 0) {
    return "This version shows a modest but positive improvement, suggesting incremental model refinement.";
  }

  if (dropped >= 2) {
    return "This version shows measurable regression across multiple metrics and may require rollback or further tuning.";
  }

  return "This version reflects mixed metric behavior, suggesting trade-offs introduced during experimentation.";
}

function getPossibleReasons(version, previousVersion, evolution, isAI = false) {
  if (!version || !previousVersion || !evolution) {
    return [
      isAI
        ? "Initial intelligence state established as baseline."
        : "Initial model version established as baseline.",
    ];
  }

  const reasons = [];

  if (evolution.datasetChanged) {
    reasons.push(
      isAI
        ? "Knowledge context changed, which likely influenced prediction behavior."
        : "Dataset context changed, which may have impacted model performance."
    );
  }

  if (evolution.experimentChanged) {
    reasons.push(
      isAI
        ? "Learning intent or behavioral direction changed from the previous intelligence state."
        : "Experiment strategy changed compared to the previous version."
    );
  }

  if (evolution.codeSummaryChanged) {
    reasons.push(
      isAI
        ? "Decision logic or trust behavior was modified in this intelligence cycle."
        : "Training or preprocessing logic was modified in this version."
    );
  }

  if (evolution.accuracyChange > 0) {
    reasons.push(
      isAI
        ? "Confidence improved, suggesting stronger prediction certainty."
        : "Accuracy improved, indicating better overall prediction correctness."
    );
  }

  if (evolution.precisionChange > 0) {
    reasons.push(
      isAI
        ? "Trust score improved, which suggests more reliable positive decisions."
        : "Precision improved, suggesting fewer false positives."
    );
  }

  if (evolution.recallChange > 0) {
    reasons.push(
      isAI
        ? "Stability improved, indicating better capture of valid outcomes."
        : "Recall improved, indicating the model is catching more relevant cases."
    );
  }

  if (evolution.recallChange < 0) {
    reasons.push(
      isAI
        ? "Stability dropped slightly, which may indicate stricter or less flexible decision behavior."
        : "Recall dropped, which may indicate the model became more selective."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      isAI
        ? "No major behavioral changes were detected between intelligence states."
        : "No major experimental changes were detected between versions."
    );
  }

  return reasons;
}

function getRiskAssessment(version, evolution, isAI = false) {
  if (!version) return "N/A";

  const accuracy = Number(version.accuracy || 0);
  const precision = Number(version.precision || 0);
  const recall = Number(version.recall || 0);

  if (isAI) {
    if (accuracy >= 0.9 && precision >= 0.9 && recall >= 0.9) {
      return "Low Risk • Highly reliable intelligence state";
    }

    if (accuracy >= 0.8 && precision >= 0.75) {
      return "Moderate Risk • Stable intelligence behavior";
    }

    if (recall < 0.6) {
      return "High Risk • Intelligence may be too narrow or unstable";
    }

    return "Moderate Risk • Needs further behavioral validation";
  }

  if (accuracy >= 0.9 && precision >= 0.9 && recall >= 0.9) {
    return "Low Risk • Strong production candidate";
  }

  if (accuracy >= 0.8 && precision >= 0.75) {
    return "Moderate Risk • Reasonably stable experimental version";
  }

  if (recall < 0.6) {
    return "High Risk • Possible under-detection or overfitting issue";
  }

  return "Moderate Risk • Needs further validation";
}

function getBehaviorInsight(version, evolution, isAI = false) {
  if (!version || !evolution) {
    return isAI
      ? "Baseline intelligence state recorded."
      : "Baseline version recorded.";
  }

  const acc = evolution.accuracyChange;
  const prec = evolution.precisionChange;
  const rec = evolution.recallChange;

  if (prec > 0 && rec < 0) {
    return isAI
      ? "This intelligence became more cautious and selective in its decisions."
      : "This version became more precise but less flexible in identifying positives.";
  }

  if (prec < 0 && rec > 0) {
    return isAI
      ? "This intelligence became more permissive, capturing more outcomes but with lower trust quality."
      : "This version captures more cases, but may produce more false positives.";
  }

  if (acc > 0 && prec > 0 && rec > 0) {
    return isAI
      ? "This intelligence state improved holistically with stronger adaptive balance."
      : "This version improved in a balanced way across all key metrics.";
  }

  return isAI
    ? "This intelligence state shows mixed behavioral adaptation."
    : "This version reflects mixed experimental behavior.";
}

/* =========================
   RECOMMENDATION ENGINE
========================= */

function getRecommendedAction(version, evolution, isAI = false) {
  if (!version) return "N/A";

  const accuracy = Number(version.accuracy || 0);
  const precision = Number(version.precision || 0);
  const recall = Number(version.recall || 0);

  if (!evolution) {
    return isAI
      ? "Establish baseline intelligence"
      : "Establish baseline version";
  }

  if (accuracy >= 0.9 && precision >= 0.85 && recall >= 0.85) {
    return isAI
      ? "Advance Intelligence State"
      : "Promote to Verified Candidate";
  }

  if (accuracy < 0.7) {
    return isAI
      ? "Re-train Intelligence"
      : "Rollback or Retrain";
  }

  if (precision > recall + 0.08) {
    return isAI
      ? "Improve Stability Balance"
      : "Improve Recall Before Release";
  }

  if (recall > precision + 0.08) {
    return isAI
      ? "Improve Trust Calibration"
      : "Tune Precision Before Release";
  }

  return isAI
    ? "Continue Adaptive Refinement"
    : "Continue Experimental Validation";
}

function getReleaseReadiness(version, evolution, isAI = false) {
  if (!version) return "N/A";

  const accuracy = Number(version.accuracy || 0);
  const precision = Number(version.precision || 0);
  const recall = Number(version.recall || 0);

  if (accuracy >= 0.9 && precision >= 0.85 && recall >= 0.85) {
    return isAI
      ? "Ready for behavioral deployment review"
      : "Ready for validation / release review";
  }

  if (accuracy >= 0.8 && precision >= 0.75) {
    return isAI
      ? "Stable for behavioral validation"
      : "Stable for testing and validation";
  }

  if (accuracy < 0.7) {
    return isAI
      ? "Not ready for intelligence promotion"
      : "Not ready for release";
  }

  return isAI
    ? "Usable, but needs more refinement"
    : "Promising, but needs more validation";
}

function getOptimizationFocus(version, evolution, isAI = false) {
  if (!version) return "N/A";

  const precision = Number(version.precision || 0);
  const recall = Number(version.recall || 0);
  const accuracy = Number(version.accuracy || 0);

  if (accuracy < 0.7) {
    return isAI ? "Core learning quality" : "Overall model quality";
  }

  if (precision > recall + 0.08) {
    return isAI ? "Stability expansion" : "Recall optimization";
  }

  if (recall > precision + 0.08) {
    return isAI ? "Trust calibration" : "Precision optimization";
  }

  return isAI
    ? "Balanced intelligence refinement"
    : "Balanced metric tuning";
}

function getSuggestedNextStep(version, evolution, isAI = false) {
  if (!version) return "N/A";

  const accuracy = Number(version.accuracy || 0);
  const precision = Number(version.precision || 0);
  const recall = Number(version.recall || 0);

  if (!evolution) {
    return isAI
      ? "Run a second intelligence cycle to begin adaptive comparison."
      : "Train a second version to begin historical comparison.";
  }

  if (accuracy >= 0.9 && precision >= 0.85 && recall >= 0.85) {
    return isAI
      ? "Use this intelligence state as the new trusted reference baseline."
      : "Use this version as your new benchmark or release candidate.";
  }

  if (precision > recall + 0.08) {
    return isAI
      ? "Run another cycle focused on broader stability and outcome capture."
      : "Retrain with recall-focused improvements to reduce missed cases.";
  }

  if (recall > precision + 0.08) {
    return isAI
      ? "Refine trust behavior to reduce uncertain or noisy decisions."
      : "Tune precision to reduce false positives before release.";
  }

  if (accuracy < 0.7) {
    return isAI
      ? "Review data quality and refine learning logic before next cycle."
      : "Revisit preprocessing, features, or hyperparameters before retraining.";
  }

  return isAI
    ? "Compare this intelligence state against the strongest previous state."
    : "Compare this version against your best-performing version before promotion.";
}

function NavCard({ title, versionId, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`version-nav-card ${disabled ? "disabled" : ""}`}
    >
      <p className="version-nav-label">{title}</p>
      <h3 className="version-nav-value">{versionId || "Unavailable"}</h3>
    </button>
  );
}

export default VersionDetailPage;