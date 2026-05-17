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
        <h1 className="page-title 3d-float" style={{ animationDuration: '6s' }}>
          Ace Every Interview<br />with <span className="gradient">AI-Powered</span> Practice
        </h1>
        <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", marginBottom: "2.5rem", maxWidth: "600px", margin: "0 auto 2.5rem", textShadow: "0 0 10px var(--bg-primary)" }}>
          Speak your answers, get instant AI feedback on content quality, voice
          confidence, and filler words. Track your progress and level up.
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
      <div className="stagger-children" style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "1.5rem",
        textAlign: "left",
        perspective: "1500px"
      }}>
        <TiltCard>
          <div className="icon" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗣️</div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>Speech Recognition</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Browser-native speech-to-text transcribes your answers in real-time as you speak.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="icon" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤖</div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>AI Evaluation</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Gemini AI scores your answer for clarity, relevance, depth, and provides actionable tips.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="icon" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>Voice Analysis</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Real-time waveform visualization with pitch, pace, and pause detection for confidence scoring.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="icon" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎯</div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>Adaptive Difficulty</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Questions automatically adjust from Fresher to Staff level based on your performance.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="icon" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📈</div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>Progress Tracking</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your scores over time, identify weak topics, and see your improvement trajectory.</p>
        </TiltCard>
        
        <TiltCard>
          <div className="icon" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚫</div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>Filler Detection</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Detects "um", "uh", "like", "basically" and other filler words to clean up your speech.</p>
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
