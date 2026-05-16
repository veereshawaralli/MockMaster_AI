import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(17, 17, 39, 0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "0.75rem 1rem",
      fontSize: "0.85rem"
    }}>
      <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? Math.round(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export function ScoreTrendChart({ data }) {
  if (!data || data.length === 0) return <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No sessions yet</p>;

  const chartData = data.map((s, i) => ({
    name: `#${i + 1}`,
    Score: Math.round(s.total_score || 0),
    topic: s.topic,
  }));

  return (
    <div className="chart-container">
      <div className="chart-title">📈 Score Trend</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopicBarChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((t) => ({
    name: t.topic,
    "Avg Score": Math.round(t.avg_score || 0),
    "Best Score": Math.round(t.best_score || 0),
    Sessions: t.sessions,
  }));

  return (
    <div className="chart-container">
      <div className="chart-title">📊 Performance by Topic</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
          <Bar dataKey="Avg Score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Best Score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopicRadarChart({ data }) {
  if (!data || data.length < 3) return null;

  const chartData = data.map((t) => ({
    topic: t.topic,
    score: Math.round(t.avg_score || 0),
  }));

  return (
    <div className="chart-container">
      <div className="chart-title">🎯 Topic Coverage</div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="topic" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Score" dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
