export function getVersionBadges(version, evolution = null, isAI = false) {
  if (!version) return [];

  const accuracy = Number(version.accuracy || 0);
  const precision = Number(version.precision || 0);
  const recall = Number(version.recall || 0);

  const badges = [];

  /* ================= AI MODE ================= */
  if (isAI) {
    if (accuracy >= 0.9 && precision >= 0.85 && recall >= 0.85) {
      badges.push({ label: "High Intelligence", type: "success" });
    }

    if (accuracy >= 0.75 && accuracy < 0.9) {
      badges.push({ label: "Stable Intelligence", type: "info" });
    }

    if (accuracy < 0.75) {
      badges.push({ label: "Learning Phase", type: "warning" });
    }

    if (accuracy < 0.65) {
      badges.push({ label: "Needs Refinement", type: "danger" });
    }

    if (Math.abs(precision - recall) < 0.05) {
      badges.push({ label: "Balanced Intelligence", type: "neutral" });
    }

    if (evolution && evolution.accuracyChange > 0) {
      badges.push({ label: "Evolving", type: "info" });
    }
  }

  /* ================= BLOCKCHAIN MODE ================= */
  else {
    if (accuracy >= 0.9 && precision >= 0.85 && recall >= 0.85) {
      badges.push({ label: "Production Ready", type: "success" });
    }

    if (accuracy >= 0.8) {
      badges.push({ label: "Stable Build", type: "info" });
    }

    if (accuracy < 0.75) {
      badges.push({ label: "Experimental", type: "warning" });
    }

    if (accuracy < 0.65) {
      badges.push({ label: "Needs Retraining", type: "danger" });
    }

    if (version.dataset_hash) {
      badges.push({ label: "Verified", type: "neutral" });
    }
  }

  return badges;
}