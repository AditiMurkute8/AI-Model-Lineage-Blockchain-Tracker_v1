import { useEffect, useMemo, useState } from "react";
import { getVersions } from "../services/api";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import InfoBox from "../components/InfoBox";

function BlockchainPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const data = await getVersions();
      setVersions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Blockchain load error:", error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedVersions = useMemo(() => {
    return [...versions].sort(
      (a, b) =>
        parseInt((a.version_id || "v0").replace("v", "")) -
        parseInt((b.version_id || "v0").replace("v", ""))
    );
  }, [versions]);

  const latestVersion =
    sortedVersions.length > 0
      ? sortedVersions[sortedVersions.length - 1]
      : null;

  const integrityStatus = useMemo(() => {
    if (sortedVersions.length === 0) return "No Data";
    return verifyChainIntegrity(sortedVersions) ? "Verified" : "Broken";
  }, [sortedVersions]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Blockchain Verification"
        subtitle="Verify model lineage integrity using version linkage and dataset hash traceability."
      />

      {loading ? (
        <p className="loading-text">Loading verification data...</p>
      ) : sortedVersions.length === 0 ? (
        <div className="page-card">
          <p className="loading-text">
            No version verification data available yet.
          </p>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Verified Versions</p>
              <h2 className="stat-value">{sortedVersions.length}</h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">Latest Verified Version</p>
              <h2 className="stat-value">
                {latestVersion?.version_id || "N/A"}
              </h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">Chain Integrity</p>
              <h2
                className="stat-value"
                style={{
                  color:
                    integrityStatus === "Verified" ? "#22c55e" : "#ef4444",
                }}
              >
                {integrityStatus}
              </h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">Latest Dataset Hash</p>
              <h2
                className="stat-value"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.7",
                  color: "#38bdf8",
                }}
              >
                {shortHash(latestVersion?.dataset_hash)}
              </h2>
            </div>
          </div>

          {/* TRUST PANEL */}
          <SectionCard title="Integrity Trust Layer">
            <div className="info-grid">
              <InfoBox
                label="Verification Logic"
                value="Each model version stores lineage and dataset hash references."
              />
              <InfoBox
                label="Tamper Awareness"
                value="Broken parent linkage or inconsistent metadata can indicate integrity issues."
              />
              <InfoBox
                label="Traceability Value"
                value="Every version can be traced back to its previous model evolution state."
              />
              <InfoBox
                label="System Purpose"
                value="Ensures transparent and auditable AI model development."
              />
            </div>
          </SectionCard>

          {/* VERSION VERIFICATION FEED */}
          <SectionCard title="Version Verification Feed">
            <div style={{ display: "grid", gap: "18px" }}>
              {sortedVersions.map((version, index) => {
                const verified = isVersionVerified(version, sortedVersions);

                return (
                  <div
                    key={version.version_id || index}
                    style={{
                      background: "rgba(15, 23, 42, 0.92)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "22px",
                      padding: "22px",
                      display: "grid",
                      gap: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            color: "#38bdf8",
                            fontSize: "22px",
                            marginBottom: "8px",
                          }}
                        >
                          {version.version_id}
                        </h3>

                        <p style={{ color: "#94a3b8", lineHeight: "1.8" }}>
                          Integrity record for this model version.
                        </p>
                      </div>

                      <div
                        style={{
                          padding: "10px 16px",
                          borderRadius: "999px",
                          background: verified
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                          border: verified
                            ? "1px solid rgba(34,197,94,0.28)"
                            : "1px solid rgba(239,68,68,0.28)",
                          color: verified ? "#86efac" : "#fca5a5",
                          fontWeight: "700",
                          fontSize: "14px",
                        }}
                      >
                        {verified ? "Verified" : "Integrity Issue"}
                      </div>
                    </div>

                    <div className="info-grid">
                      <InfoBox label="Version ID" value={version.version_id || "N/A"} />
                      <InfoBox label="Previous Version" value={version.previous_version || "None"} />
                      <InfoBox label="Dataset Hash" value={version.dataset_hash || "N/A"} />
                      <InfoBox label="Model Type" value={version.model_type || "N/A"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* WHY THIS MATTERS */}
          <SectionCard title="Why This Matters">
            <div
              style={{
                display: "grid",
                gap: "18px",
                color: "#cbd5e1",
                lineHeight: "1.9",
                fontSize: "16px",
              }}
            >
              <p>
                In real AI systems, simply storing model files is not enough.
                You also need to know <strong>what changed</strong>,{" "}
                <strong>where it came from</strong>, and whether the lineage is
                still trustworthy.
              </p>

              <p>
                This verification layer adds a blockchain-inspired trust model
                by preserving version relationships and dataset hashes across
                the training lifecycle.
              </p>

              <p>
                That means your project does not just track models —
                it tracks <strong>integrity</strong>.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

/* ================= HELPERS ================= */

function shortHash(hash) {
  if (!hash) return "N/A";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function isVersionVerified(version, allVersions) {
  if (!version?.version_id) return false;

  if (!version.previous_version || version.previous_version === "None") {
    return true;
  }

  return allVersions.some((v) => v.version_id === version.previous_version);
}

function verifyChainIntegrity(versions) {
  return versions.every((version) => isVersionVerified(version, versions));
}

export default BlockchainPage;