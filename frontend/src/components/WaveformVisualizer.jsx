import { useRef, useEffect } from "react";

/**
 * Real-time waveform visualizer using Canvas.
 * Renders audio waveform data from Web Audio API.
 */
export default function WaveformVisualizer({ data, isActive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const expectedWidth = rect.width * dpr;
    const expectedHeight = rect.height * dpr;
    
    // Only resize if necessary to prevent canvas context crashing
    if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
      canvas.width = expectedWidth;
      canvas.height = expectedHeight;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, width, height);

    if (!data || data.length === 0) {
      // Draw flat line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(124, 58, 237, 0.3)";
      ctx.lineWidth = 2;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    // Draw waveform
    const sliceWidth = width / data.length;
    let x = 0;

    // Glow effect
    ctx.shadowBlur = isActive ? 15 : 5;
    ctx.shadowColor = isActive ? "rgba(124, 58, 237, 0.6)" : "rgba(124, 58, 237, 0.2)";

    // Main wave
    ctx.beginPath();
    ctx.lineWidth = 2;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#7c3aed");
    gradient.addColorStop(0.5, "#3b82f6");
    gradient.addColorStop(1, "#06b6d4");
    ctx.strokeStyle = gradient;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();

    // Mirror wave (subtle)
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;
    x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = height - (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [data, isActive]);

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
