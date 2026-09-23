import { useRef, useEffect } from "react";

/**
 * Real-time waveform visualizer using Canvas.
 *
 * Runs its own requestAnimationFrame loop and reads the live AnalyserNode
 * directly from `analyser` (a ref object from useAudioAnalyzer). This keeps
 * the 60fps rendering entirely out of React's render cycle — nothing here
 * triggers a component re-render, and no per-frame typed arrays are allocated.
 */
export default function WaveformVisualizer({ analyser, isActive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId = null;
    let cssW = 0;
    let cssH = 0;
    let gradient = null;
    let timeData = null;

    // Size the backing store to the element (accounting for DPR) once here and
    // whenever the element resizes — never inside the draw loop, so the loop
    // never forces a layout/reflow.
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gradient = ctx.createLinearGradient(0, 0, cssW, 0);
      gradient.addColorStop(0, "#E0A458");
      gradient.addColorStop(0.5, "#8FB8A8");
      gradient.addColorStop(1, "#5FAEAB");
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawFlatLine = () => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(224, 164, 88, 0.35)";
      ctx.lineWidth = 2;
      ctx.moveTo(0, cssH / 2);
      ctx.lineTo(cssW, cssH / 2);
      ctx.stroke();
    };

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      if (!cssW || !cssH) return;

      ctx.clearRect(0, 0, cssW, cssH);

      const node = analyser && analyser.current;
      if (!node) {
        drawFlatLine();
        return;
      }

      if (!timeData || timeData.length !== node.fftSize) {
        timeData = new Uint8Array(node.fftSize);
      }
      node.getByteTimeDomainData(timeData);

      // Downsample so we stroke at most ~512 points regardless of fftSize.
      const len = timeData.length;
      const step = Math.max(1, Math.floor(len / 512));
      const points = Math.floor(len / step);
      const sliceWidth = cssW / points;

      // Main wave (with glow)
      ctx.shadowBlur = isActive ? 6 : 0;
      ctx.shadowColor = "rgba(224, 164, 88, 0.35)";
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let x = 0;
      for (let i = 0; i < len; i += step) {
        const v = timeData[i] / 128.0;
        const y = (v * cssH) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // Mirror wave (subtle, no glow)
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < len; i += step) {
        const v = timeData[i] / 128.0;
        const y = cssH - (v * cssH) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    draw();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [analyser, isActive]);

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
