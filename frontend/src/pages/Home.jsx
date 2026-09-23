import { Link } from "react-router-dom";
import use3DTilt from "../hooks/use3DTilt";

// Wrapper component to apply 3D tilt individually
const TiltCard = ({ children }) => {
  const tiltRef = use3DTilt({ max: 15, scale: 1.05, glare: true });
  return (
    <div ref={tiltRef} className="card tilt-card">
      {children}
    </div>
  );
};

export default function Home() {
  return (
    <div className="page-container animate-fade-in" style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", marginBottom: "4rem" }} className="perspective-container">
        <h1 className="page-title">
          Rehearse the interview<br />before it counts.
        </h1>
        <p className="page-subtitle" style={{ margin: "0.9rem auto 2.5rem" }}>
          Answer real questions out loud. Get instant, specific feedback on what
          you said, how confident you sounded, and the filler words to cut.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", perspective: "1000px" }}>
          <Link to="/interview" className="btn btn-primary btn-lg">
            Start Interview
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-lg">
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Feature Cards in 3D */}
      <div className="feature-grid stagger-children" style={{ textAlign: "left" }}>
        <TiltCard>
          <div className="feature-icon">🗣️</div>
          <h3 className="feature-title">Speech Recognition</h3>
          <p className="feature-desc">Browser-native speech-to-text transcribes your answers in real-time as you speak.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="feature-icon">🤖</div>
          <h3 className="feature-title">AI Evaluation</h3>
          <p className="feature-desc">Gemini AI scores your answer for clarity, relevance, depth, and provides actionable tips.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">Voice Analysis</h3>
          <p className="feature-desc">Real-time waveform visualization with pitch, pace, and pause detection for confidence scoring.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="feature-icon">🎯</div>
          <h3 className="feature-title">Adaptive Difficulty</h3>
          <p className="feature-desc">Questions automatically adjust from Fresher to Staff level based on your performance.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="feature-icon">📈</div>
          <h3 className="feature-title">Progress Tracking</h3>
          <p className="feature-desc">Track your scores over time, identify weak topics, and see your improvement trajectory.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="feature-icon">🚫</div>
          <h3 className="feature-title">Filler Detection</h3>
          <p className="feature-desc">Detects "um", "uh", "like", "basically" and other filler words to clean up your speech.</p>
        </TiltCard>
      </div>

      {/* Tech Badges */}
      <div style={{ marginTop: "4rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", opacity: 0.8 }}>
        {["FastAPI", "Gemini AI", "Web Speech API", "Web Audio API", "React", "Recharts"].map(
          (tech) => (
            <span key={tech} className="badge" style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>{tech}</span>
          )
        )}
      </div>
    </div>
  );
}
