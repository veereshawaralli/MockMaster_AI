import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ScoreTrendChart, TopicBarChart, TopicRadarChart } from "../components/ProgressChart";
import { getDashboard, getSessions, deleteSession } from "../api";
import use3DTilt from "../hooks/use3DTilt";

const TiltStatCard = ({ className, children }) => {
  const tiltRef = use3DTilt({ max: 15, scale: 1.05, glare: true });
  return (
    <div ref={tiltRef} className={`stat-card tilt-card ${className}`}>
      {children}
    </div>
  );
};

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
        <p>Loading hologram dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="icon 3d-float">⚠️</div>
          <p style={{ color: "var(--accent-amber)" }}>{error}</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.overall && stats.overall.total_sessions > 0;

  return (
    <div className="page-container">
      <div className="page-header perspective-container">
        <h1 className="page-title 3d-float">Progress Dashboard</h1>
        <p className="page-subtitle" style={{ color: "var(--text-secondary)" }}>Track your interview performance over time</p>
      </div>

      {!hasData ? (
        <div className="empty-state animate-fade-in perspective-container">
          <div className="icon 3d-float" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>No interview sessions yet. Start practicing to see your progress!</p>
          <Link to="/interview" className="btn btn-primary btn-lg">
            🎤 Start First Interview
          </Link>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Overview Stats */}
          <div className="stats-grid stagger-children">
            <TiltStatCard className="stat-purple">
              <div className="stat-value">{stats.overall.total_sessions}</div>
              <div className="stat-label">Total Sessions</div>
            </TiltStatCard>
            <TiltStatCard className="stat-blue">
              <div className="stat-value">{Math.round(stats.overall.avg_score)}</div>
              <div className="stat-label">Avg Score</div>
            </TiltStatCard>
            <TiltStatCard className="stat-cyan">
              <div className="stat-value">{Math.round(stats.overall.total_questions)}</div>
              <div className="stat-label">Questions Answered</div>
            </TiltStatCard>
            <TiltStatCard className="stat-green">
              <div className="stat-value">{Math.round(stats.avg_confidence)}%</div>
              <div className="stat-label">Avg Confidence</div>
            </TiltStatCard>
            <TiltStatCard className="stat-amber">
              <div className="stat-value">{Math.round(stats.avg_fillers)}</div>
              <div className="stat-label">Avg Fillers/Answer</div>
            </TiltStatCard>
            {stats.most_improved_topic && (
              <TiltStatCard className="stat-green">
                <div className="stat-value" style={{ fontSize: "1.5rem", marginTop: "0.5rem" }}>
                  {stats.most_improved_topic.topic}
                </div>
                <div className="stat-label">Most Improved</div>
              </TiltStatCard>
            )}
          </div>

          {/* Charts */}
          <div className="two-col perspective-container" style={{ perspective: '2000px' }}>
            <ScoreTrendChart data={stats.trend} />
            <TopicBarChart data={stats.by_topic} />
          </div>

          {stats.by_topic?.length >= 3 && (
            <TopicRadarChart data={stats.by_topic} />
          )}

          {/* Session History */}
          <div style={{ marginTop: "3rem" }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              📋 Session History
            </h2>
            <div className="session-list stagger-children">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="session-item"
                  onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                >
                  <div className="session-info">
                    <div className="session-topic" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600 }}>
                      {s.topic}
                      <span className="badge badge-cyan" style={{ marginLeft: "1rem" }}>
                        {s.difficulty}
                      </span>
                    </div>
                    <div className="session-meta" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                      <span>{s.total_questions} questions</span>
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div className="session-score" style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: (s.total_score || 0) >= 70 ? "var(--accent-green)"
                        : (s.total_score || 0) >= 40 ? "var(--accent-amber)"
                        : "var(--accent-red)",
                      textShadow: `0 0 10px ${(s.total_score || 0) >= 70 ? "var(--accent-green-bg)" : (s.total_score || 0) >= 40 ? "var(--accent-amber-bg)" : "var(--accent-red-bg)"}`
                    }}>
                      {Math.round(s.total_score || 0)}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleDelete(s.id, e)}
                      title="Delete session"
                      style={{ fontSize: '1.2rem', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '50%' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link to="/interview" className="btn btn-primary btn-lg">
              🎤 Start New Interview
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
