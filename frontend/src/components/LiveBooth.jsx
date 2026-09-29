import { useState, useEffect } from "react";

/**
 * Animated "live mock interview" preview for the landing hero.
 * One orchestrated page-load moment: the question types out, a waveform
 * pulses, and the confidence ring counts up — a small live demo of the
 * product. Everything degrades to a static, fully-legible state under
 * prefers-reduced-motion.
 */

const QUESTION = "Tell me about a time you led a project under pressure.";
const TARGET_CONFIDENCE = 88;
const BARS = 34;

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = (e) => setReduce(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduce;
}

export default function LiveBooth() {
  const reduce = usePrefersReducedMotion();
  const [typed, setTyped] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Type the interviewer question out, character by character.
  useEffect(() => {
    if (reduce) { setTyped(QUESTION); return; }
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(QUESTION.slice(0, i));
      if (i >= QUESTION.length) clearInterval(id);
    }, 34);
    return () => clearInterval(id);
  }, [reduce]);

  // Count the confidence ring up, starting after the question is roughly typed.
  useEffect(() => {
    if (reduce) { setConfidence(TARGET_CONFIDENCE); return; }
    let raf, start;
    const delay = setTimeout(() => {
      const duration = 1500;
      const step = (t) => {
        if (start === undefined) start = t;
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setConfidence(Math.round(TARGET_CONFIDENCE * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, 2100);
    return () => { clearTimeout(delay); cancelAnimationFrame(raf); };
  }, [reduce]);

  // Live clock so the panel keeps a heartbeat after the intro settles.
  useEffect(() => {
    if (reduce) { setSeconds(42); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [reduce]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div
      className="live-booth"
      role="img"
      aria-label={`Live mock interview preview — confidence ${TARGET_CONFIDENCE} percent`}
    >
      <div className="booth-top" aria-hidden="true">
        <span className="booth-live"><span className="booth-live-dot" />LIVE</span>
        <span className="booth-timer">{mm}:{ss}</span>
      </div>

      <div className="booth-qlabel" aria-hidden="true">Interviewer</div>
      <p className="booth-question" aria-hidden="true">
        {typed}
        <span className="booth-caret" />
      </p>

      <div className="booth-wave" aria-hidden="true">
        {Array.from({ length: BARS }).map((_, i) => (
          <span key={i} style={{ "--i": i }} />
        ))}
      </div>

      <div className="booth-foot" aria-hidden="true">
        <div className="booth-ring" style={{ "--val": confidence }}>
          <div className="booth-ring-inner">
            <span className="booth-ring-num">{confidence}</span>
            <span className="booth-ring-cap">confidence</span>
          </div>
        </div>
        <div className="booth-chips">
          <span className="booth-chip booth-chip-cyan">Steady pace</span>
          <span className="booth-chip booth-chip-amber">2 fillers</span>
          <span className="booth-chip booth-chip-green">Clear answer</span>
        </div>
      </div>
    </div>
  );
}
