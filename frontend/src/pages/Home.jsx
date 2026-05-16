import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="hero animate-fade-in">
      <h1 className="hero-title">
        Ace Every Interview with{" "}
        <span className="gradient">AI-Powered Practice</span>
      </h1>
      <p className="hero-subtitle">
        Speak your answers, get instant AI feedback on content quality, voice
        confidence, and filler words. Track your progress and level up.
      </p>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/interview" className="btn btn-primary btn-lg">
          🎤 Start Interview
        </Link>
        <Link to="/dashboard" className="btn btn-outline btn-lg">
          📊 View Dashboard
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="hero-features stagger-children">
        <div className="hero-feature">
          <div className="icon">🗣️</div>
          <h3>Speech Recognition</h3>
          <p>Browser-native speech-to-text transcribes your answers in real-time as you speak.</p>
        </div>
        <div className="hero-feature">
          <div className="icon">🤖</div>
          <h3>AI Evaluation</h3>
          <p>Gemini AI scores your answer for clarity, relevance, depth, and provides actionable tips.</p>
        </div>
        <div className="hero-feature">
          <div className="icon">📊</div>
          <h3>Voice Analysis</h3>
          <p>Real-time waveform visualization with pitch, pace, and pause detection for confidence scoring.</p>
        </div>
        <div className="hero-feature">
          <div className="icon">🎯</div>
          <h3>Adaptive Difficulty</h3>
          <p>Questions automatically adjust from Fresher to Staff level based on your performance.</p>
        </div>
        <div className="hero-feature">
          <div className="icon">📈</div>
          <h3>Progress Tracking</h3>
          <p>Track your scores over time, identify weak topics, and see your improvement trajectory.</p>
        </div>
        <div className="hero-feature">
          <div className="icon">🚫</div>
          <h3>Filler Detection</h3>
          <p>Detects "um", "uh", "like", "basically" and other filler words to clean up your speech.</p>
        </div>
      </div>

      {/* Tech Badges */}
      <div style={{ marginTop: "3rem", display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        {["FastAPI", "Gemini AI", "Web Speech API", "Web Audio API", "React", "Recharts"].map(
          (tech) => (
            <span key={tech} className="badge badge-purple">{tech}</span>
          )
        )}
      </div>
    </div>
  );
}
