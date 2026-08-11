import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function MetricLineChart({ title, dataKey, versions = [] }) {
  const chartData = versions.map((v) => ({
    version: v.version_id,
    [dataKey]: Number(v[dataKey] || 0),
  }));

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <XAxis
              dataKey="version"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              domain={[0, 1]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                color: "#fff",
              }}
              labelStyle={{ color: "#38bdf8", fontWeight: "700" }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 5, fill: "#38bdf8" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MetricLineChart;