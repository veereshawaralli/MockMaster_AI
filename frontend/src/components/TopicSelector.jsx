import use3DTilt from "../hooks/use3DTilt";

const TOPIC_CONFIG = {
  HR: { icon: "💼", color: "var(--accent-purple)" },
  DSA: { icon: "🧩", color: "var(--accent-blue)" },
  "System Design": { icon: "🏗️", color: "var(--accent-cyan)" },
  Behavioral: { icon: "🧠", color: "var(--accent-green)" },
  Frontend: { icon: "🎨", color: "var(--accent-pink)" },
  Backend: { icon: "⚙️", color: "var(--accent-amber)" },
};

const DIFFICULTIES = ["Fresher", "Mid", "Senior", "Staff"];

const TiltTopicCard = ({ topic, config, isSelected, onClick }) => {
  const tiltRef = use3DTilt({ max: 20, scale: 1.05, glare: true });
  return (
    <div
      ref={tiltRef}
      className={`topic-card tilt-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="topic-icon">{config.icon}</div>
      <div className="topic-name">{topic}</div>
    </div>
  );
};

/**
 * Topic and difficulty selector with animated 3D cards.
 */
export default function TopicSelector({
  selectedTopic,
  selectedDifficulty,
  onSelectTopic,
  onSelectDifficulty,
}) {
  return (
    <div className="animate-fade-in perspective-container">
      {/* Topic Grid */}
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", textAlign: "center", marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.2em" }}>
        Choose a Topic
      </h3>
      <div className="topic-grid stagger-children">
        {Object.entries(TOPIC_CONFIG).map(([topic, config]) => (
          <TiltTopicCard
            key={topic}
            topic={topic}
            config={config}
            isSelected={selectedTopic === topic}
            onClick={() => onSelectTopic(topic)}
          />
        ))}
      </div>

      {/* Difficulty Selector */}
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", textAlign: "center", marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "1rem" }}>
        Difficulty Level
      </h3>
      <div className="difficulty-row stagger-children">
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
