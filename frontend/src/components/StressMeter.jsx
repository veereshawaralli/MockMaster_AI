/**
 * Animated circular confidence/stress meter.
 */
export default function StressMeter({ score = 50, label = "Confidence", size = 160 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return "var(--accent-green)";
    if (score >= 50) return "var(--accent-cyan)";
    if (score >= 30) return "var(--accent-amber)";
    return "var(--accent-red)";
  };

  const getGlow = () => {
    if (score >= 75) return "rgba(16, 185, 129, 0.2)";
    if (score >= 50) return "rgba(6, 182, 212, 0.2)";
    if (score >= 30) return "rgba(245, 158, 11, 0.2)";
    return "rgba(239, 68, 68, 0.2)";
  };

  const getLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    if (score >= 20) return "Nervous";
    return "Very Nervous";
  };

  return (
    <div className="stress-meter">
      <div
        className="meter-circle"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${getGlow()} 0%, transparent 70%)`,
        }}
      >
        <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s ease, stroke 0.5s ease",
              filter: `drop-shadow(0 0 6px ${getColor()})`,
            }}
          />
        </svg>
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div className="meter-value" style={{ color: getColor() }}>
            {score}%
          </div>
          <div className="meter-label">{getLabel()}</div>
        </div>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
        {label}
      </p>
    </div>
  );
}
