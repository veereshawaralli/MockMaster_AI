import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook for browser-native speech recognition (Web Speech API).
 * Returns real-time transcript (final + interim) and controls.
 */
export default function useSpeechRecognition(lang) {
  // Default to the browser's own locale (e.g. en-IN, en-GB) so the recognizer
  // loads the right accent model instead of always assuming US English — a
  // common reason spoken answers come back mis-transcribed.
  const recognitionLang =
    lang || (typeof navigator !== "undefined" && navigator.language) || "en-US";

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  // Resolver for a pending stopListening() promise; called once the engine has
  // ended and flushed its final (corrected) result.
  const pendingStopResolveRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = recognitionLang;

      recognition.onresult = (event) => {
        let interim = "";
        let final = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }

        finalTranscriptRef.current = final;
        interimTranscriptRef.current = interim;
        setTranscript(final);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Restart if still supposed to be listening
        if (recognitionRef.current && recognitionRef.current._shouldListen) {
          try {
            recognition.start();
          } catch (e) { /* ignore */ }
          return;
        }
        setIsListening(false);
        // The engine only ends after delivering the last utterance as a final
        // result, so any waiting stopListening() now gets the corrected text.
        const resolve = pendingStopResolveRef.current;
        if (resolve) {
          pendingStopResolveRef.current = null;
          resolve(
            (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim()
          );
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current._shouldListen = false;
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
    };
  }, [recognitionLang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current._shouldListen = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  }, []);

  // Returns a promise that resolves with the FINAL transcript. It waits for the
  // engine to end (which flushes its corrected result) rather than reading the
  // rough interim guess — that mismatch was what made answers come back as
  // "I said X, it wrote Y".
  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return Promise.resolve("");
    rec._shouldListen = false;
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        pendingStopResolveRef.current = null;
        setIsListening(false);
        resolve(
          (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim()
        );
      };
      pendingStopResolveRef.current = finish;
      // Fallback in case onend is slow to fire or doesn't fire at all.
      setTimeout(finish, 600);
      try {
        rec.stop();
      } catch {
        finish();
      }
    });
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // Always returns the latest transcript (avoids stale closure)
  const getTranscript = useCallback(() => {
    const fullText = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
    return fullText;
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    getTranscript,
  };
}
