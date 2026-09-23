import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for real-time audio analysis using Web Audio API.
 * Provides pitch estimation, pause detection, and volume levels.
 *
 * Performance: the rAF loop does NOT push data through React state on every
 * frame. The raw AnalyserNode is exposed via `analyserRef` so the waveform
 * canvas can read it directly (see WaveformVisualizer), and the human-readable
 * stats (volume/pitch/pauseCount) are throttled to ~10fps to avoid forcing a
 * full component re-render 60 times per second.
 */
export default function useAudioAnalyzer() {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSilentRef = useRef(false);
  const pauseCountRef = useRef(0);
  const pitchRef = useRef(0);
  const lastUiUpdateRef = useRef(0);

  // Throttle React state updates for on-screen stats to ~10fps.
  const UI_INTERVAL_MS = 100;

  const startAnalyzing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      pauseCountRef.current = 0;
      pitchRef.current = 0;
      lastUiUpdateRef.current = 0;
      setPauseCount(0);
      setIsActive(true);

      const bufferLength = analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLength); // reused every frame — no per-frame allocation
      const nyquist = audioContext.sampleRate / 2;

      const analyze = () => {
        if (!analyserRef.current) return;
        animFrameRef.current = requestAnimationFrame(analyze);

        analyser.getByteFrequencyData(freqData);

        // Volume (average magnitude) + dominant frequency (pitch) in one pass.
        let sum = 0;
        let maxVal = 0;
        let maxIndex = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = freqData[i];
          sum += val;
          if (val > maxVal) {
            maxVal = val;
            maxIndex = i;
          }
        }
        const avg = sum / bufferLength;
        const normalizedVolume = Math.min(100, Math.round((avg / 255) * 200));

        const estimatedPitch = (maxIndex / bufferLength) * nyquist;
        if (estimatedPitch > 50 && estimatedPitch < 1000) {
          pitchRef.current = Math.round(estimatedPitch);
        }

        // Pause detection — cheap, ref-based, runs every frame for responsiveness.
        if (normalizedVolume < 8) {
          if (!isSilentRef.current) {
            isSilentRef.current = true;
            silenceTimerRef.current = setTimeout(() => {
              pauseCountRef.current += 1;
              setPauseCount(pauseCountRef.current);
            }, 800); // Count as pause after 800ms of silence
          }
        } else {
          isSilentRef.current = false;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }

        // Throttle state-driven re-renders to ~10fps.
        const now = performance.now();
        if (now - lastUiUpdateRef.current >= UI_INTERVAL_MS) {
          lastUiUpdateRef.current = now;
          setVolume(normalizedVolume);
          setPitch(pitchRef.current);
        }
      };

      analyze();
    } catch (err) {
      console.error("Failed to start audio analysis:", err);
    }
  }, []);

  const stopAnalyzing = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    analyserRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    isSilentRef.current = false;
    setIsActive(false);
  }, []);

  const getStressReport = useCallback(() => {
    const avgPitch = pitchRef.current;
    let confidence = 100;

    if (avgPitch > 350) confidence -= 20; // High pitch = nervous
    if (avgPitch < 80) confidence -= 10;  // Very low = mumbling
    if (pauseCountRef.current > 6) confidence -= 20; // Too many pauses
    else if (pauseCountRef.current > 3) confidence -= 10;

    confidence = Math.max(0, Math.min(100, confidence));

    let pace = "Normal";
    // This is a simplified estimate
    if (avgPitch > 300) pace = "Fast";
    else if (avgPitch < 100) pace = "Slow";

    return {
      confidence_score: confidence,
      avg_pitch: avgPitch,
      pause_count: pauseCountRef.current,
      speaking_pace: pace,
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, [stopAnalyzing]);

  return {
    isActive,
    volume,
    pitch,
    pauseCount,
    analyserRef,
    startAnalyzing,
    stopAnalyzing,
    getStressReport,
  };
}
