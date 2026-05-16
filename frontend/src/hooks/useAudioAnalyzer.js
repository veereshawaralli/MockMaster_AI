import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for real-time audio analysis using Web Audio API.
 * Provides waveform data, pitch estimation, pause detection, and volume levels.
 */
export default function useAudioAnalyzer() {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [waveformData, setWaveformData] = useState(new Uint8Array(128));

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSilentRef = useRef(false);
  const pauseCountRef = useRef(0);

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
      setPauseCount(0);
      setIsActive(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(analyser.fftSize);

      const analyze = () => {
        if (!analyserRef.current) return;

        // Waveform (time domain)
        analyser.getByteTimeDomainData(timeData);
        setWaveformData(new Uint8Array(timeData));

        // Volume (RMS)
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalizedVolume = Math.min(100, Math.round((avg / 255) * 200));
        setVolume(normalizedVolume);

        // Simple pitch estimation (dominant frequency)
        let maxVal = 0;
        let maxIndex = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIndex = i;
          }
        }
        const nyquist = audioContext.sampleRate / 2;
        const estimatedPitch = (maxIndex / bufferLength) * nyquist;
        if (estimatedPitch > 50 && estimatedPitch < 1000) {
          setPitch(Math.round(estimatedPitch));
        }

        // Pause detection
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

        animFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (err) {
      console.error("Failed to start audio analysis:", err);
    }
  }, []);

  const stopAnalyzing = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
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
    setIsActive(false);
  }, []);

  const getStressReport = useCallback(() => {
    const avgPitch = pitch;
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
  }, [pitch]);

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
    waveformData,
    startAnalyzing,
    stopAnalyzing,
    getStressReport,
  };
}
