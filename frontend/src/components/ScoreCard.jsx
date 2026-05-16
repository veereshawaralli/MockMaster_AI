import StressMeter from "./StressMeter";

/**
 * Comprehensive score card with evaluation results.
 */
export default function ScoreCard({ data, onNextQuestion, onEndSession }) {
  if (!data) return null;

  const { evaluation, stress, fillers, transcript } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--accent-green)";
    if (score >= 60) return "var(--accent-cyan)";
    if (score >= 40) return "var(--accent-amber)";
    return "var(--accent-red)";
  };

  const getBadgeClass = (val) => {
    if (val === "Good" || val === "Excellent") return "badge-green";
    if (val === "Average") return "badge-amber";
    return "badge-red";
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Score Header */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: getScoreColor(evaluation.score) }}>
            {evaluation.score}
          </div>
          <div className="stat-label">Answer Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: getScoreColor(stress.confidence_score) }}>
            {stress.confidence_score}%
          </div>
          <div className="stat-label">Confidence</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: fillers.total > 5 ? "var(--accent-red)" : fillers.total > 2 ? "var(--accent-amber)" : "var(--accent-green)" }}>
            {fillers.total}
          </div>
          <div className="stat-label">Filler Words</div>
        </div>
      </div>

      <div className="two-col">
        {/* Left: Feedback */}
        <div>
          {/* Quality Badges */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="score-header">📋 Quality Assessment</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className={`badge ${getBadgeClass(evaluation.clarity)}`}>
                Clarity: {evaluation.clarity}
              </span>
              <span className={`badge ${getBadgeClass(evaluation.relevance)}`}>
                Relevance: {evaluation.relevance}
              </span>
              {evaluation.depth && (
                <span className={`badge ${getBadgeClass(evaluation.depth)}`}>
                  Depth: {evaluation.depth}
                </span>
              )}
            </div>
          </div>

          {/* Strengths */}
          {evaluation.strengths?.length > 0 && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="score-header">💪 Strengths</div>
              <ul className="feedback-list">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="feedback-item">
                    <span className="feedback-icon">✅</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Points */}
          {evaluation.missing_points?.length > 0 && (
            <div className="card" style={{ marginBottom: "1rem", borderColor: "rgba(239, 68, 68, 0.2)" }}>
              <div className="score-header">❌ Missing Points</div>
              <ul className="feedback-list">
                {evaluation.missing_points.map((p, i) => (
                  <li key={i} className="feedback-item">
                    <span className="feedback-icon">📌</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement Tip */}
          <div className="card" style={{ marginBottom: "1rem", borderColor: "rgba(124, 58, 237, 0.2)" }}>
            <div className="score-header">💡 Improvement Tip</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {evaluation.improvement_tip}
            </p>
          </div>
        </div>

        {/* Right: Stress & Transcript */}
        <div>
          {/* Confidence Meter */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <StressMeter score={stress.confidence_score} />
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.5rem" }}>
              <span className="badge badge-cyan">Pace: {stress.speaking_pace}</span>
              <span className="badge badge-purple">Pauses: {stress.pause_count}</span>
            </div>
          </div>

          {/* Filler Words */}
          {fillers.total > 0 && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div className="score-header">🗣️ Filler Words</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {Object.entries(fillers.fillers).map(([word, count]) => (
                  <span key={word} className="badge badge-amber">
                    "{word}" × {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="score-header">📝 Your Answer</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
              {transcript || "No transcript available."}
            </p>
          </div>
        </div>
      </div>

      {/* Follow-up Question */}
      {evaluation.follow_up_question && (
        <div className="card" style={{ marginBottom: "1.5rem", borderColor: "rgba(6, 182, 212, 0.2)" }}>
          <div className="score-header">🔁 Follow-up Question</div>
          <p style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 500 }}>
            {evaluation.follow_up_question}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button className="btn btn-primary btn-lg" onClick={onNextQuestion}>
          Next Question →
        </button>
        <button className="btn btn-outline btn-lg" onClick={onEndSession}>
          End Session
        </button>
      </div>
    </div>
  );
}
