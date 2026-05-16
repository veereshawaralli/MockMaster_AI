import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ScoreTrendChart, TopicBarChart, TopicRadarChart } from "../components/ProgressChart";
import { getDashboard, getSessions, deleteSession } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, sessData] = await Promise.all([
        getDashboard(),
        getSessions(),
      ]);
      setStats(dashData);
      setSessions(sessData.sessions || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    try {
      await deleteSession(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: "60vh" }}>
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <p style={{ color: "var(--accent-amber)" }}>{error}</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.overall && stats.overall.total_sessions > 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Progress Dashboard</h1>
        <p className="page-subtitle">Track your interview performance over time</p>
      </div>

      {!hasData ? (
        <div className="empty-state animate-fade-in">
          <div className="icon">📊</div>
          <p>No interview sessions yet. Start practicing to see your progress!</p>
          <Link to="/interview" className="btn btn-primary btn-lg">
            🎤 Start First Interview
          </Link>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Overview Stats */}
          <div className="stats-grid stagger-children">
            <div className="stat-card stat-purple">
              <div className="stat-value">{stats.overall.total_sessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-value">{Math.round(stats.overall.avg_score)}</div>
              <div className="stat-label">Avg Score</div>
            </div>
            <div className="stat-card stat-cyan">
              <div className="stat-value">{Math.round(stats.overall.total_questions)}</div>
              <div className="stat-label">Questions Answered</div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-value">{Math.round(stats.avg_confidence)}%</div>
              <div className="stat-label">Avg Confidence</div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-value">{Math.round(stats.avg_fillers)}</div>
              <div className="stat-label">Avg Fillers/Answer</div>
            </div>
            {stats.most_improved_topic && (
              <div className="stat-card stat-green">
                <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                  {stats.most_improved_topic.topic}
                </div>
                <div className="stat-label">Most Improved</div>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="two-col">
            <ScoreTrendChart data={stats.trend} />
            <TopicBarChart data={stats.by_topic} />
          </div>

          {stats.by_topic?.length >= 3 && (
            <TopicRadarChart data={stats.by_topic} />
          )}

          {/* Session History */}
          <div style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
              📋 Session History
            </h2>
            <div className="session-list">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="session-item"
                  onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                >
                  <div className="session-info">
                    <div className="session-topic">
                      {s.topic}
                      <span className="badge badge-cyan" style={{ marginLeft: "0.5rem" }}>
                        {s.difficulty}
                      </span>
                    </div>
                    <div className="session-meta">
                      <span>{s.total_questions} questions</span>
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div className="session-score" style={{
                      color: (s.total_score || 0) >= 70 ? "var(--accent-green)"
                        : (s.total_score || 0) >= 40 ? "var(--accent-amber)"
                        : "var(--accent-red)"
                    }}>
                      {Math.round(s.total_score || 0)}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleDelete(s.id, e)}
                      title="Delete session"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link to="/interview" className="btn btn-primary btn-lg">
              🎤 Start New Interview
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
