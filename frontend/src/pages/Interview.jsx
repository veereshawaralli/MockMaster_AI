import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopicSelector from "../components/TopicSelector";
import WaveformVisualizer from "../components/WaveformVisualizer";
import ScoreCard from "../components/ScoreCard";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import useAudioAnalyzer from "../hooks/useAudioAnalyzer";
import useTimer from "../hooks/useTimer";
import { detectFillers } from "../utils/fillerDetector";
import { createSession, getQuestion, evaluateAnswer } from "../api";

const STAGES = {
  SETUP: "setup",
  READY: "ready",
  RECORDING: "recording",
  ANALYZING: "analyzing",
  RESULTS: "results",
};

export default function Interview() {
  const navigate = useNavigate();

  // State
  const [stage, setStage] = useState(STAGES.SETUP);
  const [topic, setTopic] = useState("HR");
  const [difficulty, setDifficulty] = useState("Fresher");
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [error, setError] = useState(null);

  // Hooks
  const speech = useSpeechRecognition();
  const audio = useAudioAnalyzer();
  const timer = useTimer(120);

  // Start interview session
  const startSession = async () => {
    try {
      setError(null);
      const data = await createSession(topic, difficulty);
      setSessionId(data.session_id);
      await fetchQuestion(topic, difficulty, []);
      setStage(STAGES.READY);
    } catch (err) {
      setError("Failed to start session. Is the backend running?");
      console.error(err);
    }
  };

  // Fetch a question
  const fetchQuestion = async (t, d, exclude) => {
    try {
      const q = await getQuestion(t, d, exclude);
      setCurrentQuestion(q);
      setQuestionNumber((n) => n + 1);
    } catch (err) {
      console.error("Failed to fetch question:", err);
      setError("Failed to fetch question.");
    }
  };

  // Start recording
  const startRecording = () => {
    setStage(STAGES.RECORDING);
    speech.resetTranscript();
    speech.startListening();
    audio.startAnalyzing();
    timer.start();
  };

  // Stop recording and analyze
  const stopRecording = async () => {
    speech.stopListening();
    audio.stopAnalyzing();
    timer.stop();
    setStage(STAGES.ANALYZING);

    const transcript = speech.transcript || "";
    const stressReport = audio.getStressReport();
    const fillerData = detectFillers(transcript);

    try {
      const evalResult = await evaluateAnswer({
        session_id: sessionId,
        question: currentQuestion.question,
        transcript,
        topic,
        difficulty,
        confidence_score: stressReport.confidence_score,
        avg_pitch: stressReport.avg_pitch,
        pause_count: stressReport.pause_count,
        speaking_pace: stressReport.speaking_pace,
        filler_count: fillerData.total,
        fillers: fillerData.fillers,
      });

      const fullResult = {
        transcript,
        evaluation: evalResult.evaluation,
        stress: stressReport,
        fillers: fillerData,
      };

      setResult(fullResult);
      setScores((prev) => [...prev, evalResult.evaluation.score || 0]);
      setAskedQuestions((prev) => [...prev, currentQuestion.question]);
      setStage(STAGES.RESULTS);
    } catch (err) {
      console.error("Evaluation failed:", err);
      setError("Evaluation failed. Check your API key and backend.");
      setStage(STAGES.READY);
    }
  };

  // Next question (with adaptive difficulty)
  const handleNextQuestion = async () => {
    // Check if difficulty should adapt
    let newDifficulty = difficulty;
    if (scores.length >= 2) {
      const recent = scores.slice(-3);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const DIFFS = ["Fresher", "Mid", "Senior", "Staff"];
      const idx = DIFFS.indexOf(difficulty);
      if (avg >= 80 && idx < DIFFS.length - 1) {
        newDifficulty = DIFFS[idx + 1];
      } else if (avg <= 40 && idx > 0) {
        newDifficulty = DIFFS[idx - 1];
      }
    }

    if (newDifficulty !== difficulty) {
      setDifficulty(newDifficulty);
    }

    // Use follow-up question or fetch new one
    if (result?.evaluation?.follow_up_question) {
      setCurrentQuestion({
        question: result.evaluation.follow_up_question,
        topic,
        difficulty: newDifficulty,
      });
      setQuestionNumber((n) => n + 1);
    } else {
      await fetchQuestion(topic, newDifficulty, askedQuestions);
    }

    setResult(null);
    setStage(STAGES.READY);
  };

  // End session
  const handleEndSession = () => {
    navigate(`/dashboard`);
  };

  // Render based on stage
  return (
    <div className="page-container">
      {error && (
        <div className="card" style={{
          borderColor: "rgba(239, 68, 68, 0.3)",
          marginBottom: "1.5rem",
          textAlign: "center",
          background: "rgba(239, 68, 68, 0.08)"
        }}>
          <p style={{ color: "var(--accent-red)" }}>⚠️ {error}</p>
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: "0.5rem" }}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SETUP STAGE */}
      {stage === STAGES.SETUP && (
        <div>
          <div className="page-header">
            <h1 className="page-title">Start Your Interview</h1>
            <p className="page-subtitle">Choose a topic and difficulty to begin</p>
          </div>

          {!speech.isSupported && (
            <div className="card" style={{ textAlign: "center", marginBottom: "1.5rem", borderColor: "rgba(245, 158, 11, 0.3)" }}>
              <p style={{ color: "var(--accent-amber)" }}>
                ⚠️ Speech Recognition is not supported in your browser. Please use Chrome or Edge.
              </p>
            </div>
          )}

          <TopicSelector
            selectedTopic={topic}
            selectedDifficulty={difficulty}
            onSelectTopic={setTopic}
            onSelectDifficulty={setDifficulty}
          />

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={startSession}
              disabled={!speech.isSupported}
            >
              🚀 Begin Interview
            </button>
          </div>
        </div>
      )}

      {/* READY STAGE */}
      {stage === STAGES.READY && currentQuestion && (
        <div className="animate-fade-in">
          {/* Session Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge-purple">{topic}</span>
              <span className="badge badge-cyan">{difficulty}</span>
              <span className="badge badge-blue">Q{questionNumber}</span>
            </div>
            {scores.length > 0 && (
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Avg Score: {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}
              </span>
            )}
          </div>

          {/* Question */}
          <div className="question-display">
            <div className="question-label">Interview Question</div>
            <div className="question-text">{currentQuestion.question}</div>
          </div>

          {/* Record Button */}
          <div className="recorder-container">
            <button className="record-btn idle" onClick={startRecording}>
              🎤
            </button>
            <div className="record-label">Click to start speaking</div>
          </div>
        </div>
      )}

      {/* RECORDING STAGE */}
      {stage === STAGES.RECORDING && (
        <div className="animate-fade-in">
          {/* Session Info */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span className="badge badge-purple">{topic}</span>
            <span className="badge badge-cyan">{difficulty}</span>
            <span className="badge badge-red">● RECORDING</span>
          </div>

          {/* Question (smaller) */}
          <div className="card" style={{ marginBottom: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Question</p>
            <p style={{ fontSize: "1rem", fontWeight: 500 }}>{currentQuestion?.question}</p>
          </div>

          {/* Timer */}
          <div className="timer-display">
            <span className="timer-time">{timer.formattedTime}</span>
            <span className="timer-recommended">/ {timer.recommendedTime} recommended</span>
          </div>
          <div className="timer-bar">
            <div
              className="timer-bar-fill"
              style={{
                width: `${Math.min(100, timer.progress * 100)}%`,
                background: timer.barColor,
              }}
            />
          </div>

          {/* Waveform */}
          <WaveformVisualizer data={audio.waveformData} isActive={true} />

          {/* Live Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", margin: "1rem 0" }}>
            <div className="stat-card">
              <div className="stat-value stat-cyan" style={{ fontSize: "1.5rem" }}>
                {audio.volume}
              </div>
              <div className="stat-label">Volume</div>
            </div>
            <div className="stat-card">
              <div className="stat-value stat-purple" style={{ fontSize: "1.5rem" }}>
                {audio.pauseCount}
              </div>
              <div className="stat-label">Pauses</div>
            </div>
            <div className="stat-card">
              <div className="stat-value stat-amber" style={{ fontSize: "1.5rem" }}>
                {detectFillers(speech.transcript).total}
              </div>
              <div className="stat-label">Fillers</div>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="live-transcript">
            {speech.transcript}
            <span className="interim">{speech.interimTranscript}</span>
            {!speech.transcript && !speech.interimTranscript && (
              <span style={{ color: "var(--text-muted)" }}>Listening... Start speaking</span>
            )}
          </div>

          {/* Stop Button */}
          <div className="recorder-container">
            <button className="record-btn recording" onClick={stopRecording}>
              ⏹
            </button>
            <div className="record-label">Click to stop and analyze</div>
          </div>
        </div>
      )}

      {/* ANALYZING STAGE */}
      {stage === STAGES.ANALYZING && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing your answer with AI...</p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Evaluating content, confidence, and speech patterns
          </p>
        </div>
      )}

      {/* RESULTS STAGE */}
      {stage === STAGES.RESULTS && result && (
        <div>
          <div className="page-header" style={{ marginBottom: "1.5rem" }}>
            <h2 className="page-title" style={{ fontSize: "1.75rem" }}>Your Results</h2>
            {difficulty !== scores.length > 2 && (
              <p style={{ color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                {scores.length >= 2 && scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length) >= 80
                  ? "🔥 Great performance! Difficulty may increase."
                  : ""}
              </p>
            )}
          </div>
          <ScoreCard
            data={result}
            onNextQuestion={handleNextQuestion}
            onEndSession={handleEndSession}
          />
        </div>
      )}
    </div>
  );
}
