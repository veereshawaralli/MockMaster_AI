const TOPIC_CONFIG = {
  HR: { icon: "💼", color: "var(--accent-purple)" },
  DSA: { icon: "🧩", color: "var(--accent-blue)" },
  "System Design": { icon: "🏗️", color: "var(--accent-cyan)" },
  Behavioral: { icon: "🧠", color: "var(--accent-green)" },
  Frontend: { icon: "🎨", color: "var(--accent-pink)" },
  Backend: { icon: "⚙️", color: "var(--accent-amber)" },
};

const DIFFICULTIES = ["Fresher", "Mid", "Senior", "Staff"];

/**
 * Topic and difficulty selector with animated cards.
 */
export default function TopicSelector({
  selectedTopic,
  selectedDifficulty,
  onSelectTopic,
  onSelectDifficulty,
}) {
  return (
    <div className="animate-fade-in">
      {/* Topic Grid */}
      <h3 style={{ textAlign: "center", marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Choose a Topic
      </h3>
      <div className="topic-grid stagger-children">
        {Object.entries(TOPIC_CONFIG).map(([topic, config]) => (
          <div
            key={topic}
            className={`topic-card ${selectedTopic === topic ? "selected" : ""}`}
            onClick={() => onSelectTopic(topic)}
            style={selectedTopic === topic ? { borderColor: config.color } : {}}
          >
            <div className="topic-icon">{config.icon}</div>
            <div className="topic-name">{topic}</div>
          </div>
        ))}
      </div>

      {/* Difficulty Selector */}
      <h3 style={{ textAlign: "center", marginBottom: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Difficulty Level
      </h3>
      <div className="difficulty-row">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff}
            className={`difficulty-btn ${selectedDifficulty === diff ? "active" : ""}`}
            onClick={() => onSelectDifficulty(diff)}
          >
            {diff}
          </button>
        ))}
      </div>
    </div>
  );
}
