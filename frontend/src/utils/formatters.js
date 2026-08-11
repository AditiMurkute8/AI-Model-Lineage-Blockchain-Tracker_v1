export function formatMetric(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toFixed(4);
}

export function formatDate(dateString) {
  if (!dateString) return "-";

  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}