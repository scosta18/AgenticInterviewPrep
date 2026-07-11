import { useState, useEffect, useRef } from "react";
import {
  submitAnswer,
  completeSession,
  speakText,
  getDeepgramKey,
  prefetchSpeak,
} from "../api/client";

export default function Interview({ sessionData, onComplete, mode = 'practice' }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const deepgramSocketRef = useRef(null);
  const answerRef = useRef("");
  const feedbackRef = useRef(null);
  const loadingRef = useRef(false);
  const prefetchedAudioRef = useRef(null);

  // Parse questions
  useEffect(() => {
    const raw = sessionData.questions_raw || "";
    const parsed = [];
    const blocks = raw.split(/\n(?=\d+[.)]\s)/);
    for (const block of blocks) {
      const lines = block.split("\n").filter((l) => l.trim());
      if (lines.length === 0) continue;
      const firstLine = lines[0].trim();
      if (!/^\d+[.)]\s+/.test(firstLine)) continue;
      const q = firstLine.replace(/^\d+[.)]\s+/, "").replace(/\*\*/g, "").trim();
      if (q.length > 20) {
        parsed.push(q.endsWith("?") ? q : q + "?");
      }
    }
    setQuestions(parsed.length ? parsed : [raw]);
  }, [sessionData]);

  // Speak question and start timer when question changes
  useEffect(() => {
    if (questions.length > 0 && questions[current]) {
      clearTimerFn();
      answerRef.current = "";
      feedbackRef.current = null;
      speakQuestion(questions[current]).then(() => {
        startTimer(140);
      });
    }
  }, [current, questions]);

  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const startTimer = (seconds) => {
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimerFn = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(null);
  };

  const handleAutoSubmit = () => {
    if (feedbackRef.current || loadingRef.current) return;
    if (answerRef.current.trim()) {
      handleSubmitWithAnswer(answerRef.current);
    } else {
      handleNextQuestion();
    }
  };

  const speakQuestion = async (text) => {
    try {
      if (prefetchedAudioRef.current) {
        const audioBytes = Uint8Array.from(atob(prefetchedAudioRef.current), (c) => c.charCodeAt(0));
        const blob = new Blob([audioBytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        new Audio(url).play();
        prefetchedAudioRef.current = null;
        return;
      }
      const res = await speakText(text);
      const url = URL.createObjectURL(res.data);
      new Audio(url).play();
    } catch (err) {
      console.error("Speech failed:", err);
    }
  };

  const prefetchNextQuestion = async (nextIndex) => {
    if (nextIndex >= questions.length) return;
    try {
      const res = await prefetchSpeak(questions[nextIndex]);
      prefetchedAudioRef.current = res.data.audio_b64;
    } catch (err) {
      console.error("Prefetch failed:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setLiveTranscript("");

      const keyRes = await getDeepgramKey();
      const apiKey = keyRes.data.key;

      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true`,
        ["token", apiKey]
      );
      deepgramSocketRef.current = socket;

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const transcript = data?.channel?.alternatives?.[0]?.transcript;
        const isFinal = data?.is_final;
        if (transcript) {
          if (isFinal) {
            setAnswer((prev) => {
              const updated = prev ? prev + " " + transcript : transcript;
              answerRef.current = updated;
              return updated;
            });
            setLiveTranscript("");
          } else {
            setLiveTranscript(transcript);
          }
        }
      };

      socket.onerror = (e) => console.error("Deepgram WS error:", e);
      socket.onclose = () => console.log("Deepgram WS closed");

      await new Promise((resolve, reject) => {
        socket.onopen = () => { resolve(); };
        setTimeout(() => reject(new Error("WebSocket timeout")), 5000);
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          if (socket.readyState === WebSocket.OPEN) socket.send(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (deepgramSocketRef.current) deepgramSocketRef.current.close();
        setLiveTranscript("");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Could not start recording: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmitWithAnswer = async (answerText) => {
    if (!answerText.trim()) return;
    clearTimerFn();
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await submitAnswer({
        session_id: sessionData.session_id,
        question: questions[current],
        answer: answerText,
        company_name: "the company",
        role: "the role",
      });
      feedbackRef.current = res.data;
      setFeedback(res.data);
      setScores((prev) => [...prev, res.data.score]);

      const nextIndex = current + 1;
      if (nextIndex < questions.length) {
        prefetchNextQuestion(nextIndex);
      }

      // In mock mode, auto-advance after a short delay
      if (mode === 'mock') {
        setTimeout(() => {
          handleNextQuestion();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    await handleSubmitWithAnswer(answer);
  };

  const handleNextQuestion = () => {
    clearTimerFn();
    answerRef.current = "";
    feedbackRef.current = null;
    if (current + 1 >= questions.length) {
      handleComplete();
    } else {
      setCurrent((prev) => prev + 1);
      setAnswer("");
      setFeedback(null);
    }
  };

  const handleNext = () => handleNextQuestion();

  const handleComplete = async () => {
    await completeSession(sessionData.session_id);
    onComplete(sessionData.session_id);
  };

  if (!questions.length)
    return <div className="text-center py-20 text-slate-400">Loading questions...</div>;

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  return (
    <div className="space-y-6">

      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-4">
          {mode === 'mock' && (
            <span className="text-xs text-red-400 font-mono border border-red-500/30 px-2 py-0.5 rounded">
              🎯 Mock Interview
            </span>
          )}
          {timeLeft !== null && (
            <span className={`text-sm font-mono font-bold ${
              mode === 'mock'
                ? 'text-red-400 animate-pulse'
                : timeLeft <= 30
                ? 'text-red-400 animate-pulse'
                : timeLeft <= 60
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}>
              ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          )}
          {avgScore !== null && mode === 'practice' && (
            <span className="text-sm text-purple-400 font-mono">
              Avg: {avgScore}/10
            </span>
          )}
        </div>
      </div>

      <div className="w-full bg-dark-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${mode === 'mock' ? 'bg-red-500' : 'bg-purple-500'}`}
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className={`bg-dark-700 border rounded-xl p-6 ${mode === 'mock' ? 'border-red-500/20' : 'border-dark-600'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-mono uppercase tracking-wider ${mode === 'mock' ? 'text-red-400' : 'text-purple-400'}`}>
            Question {current + 1}
          </p>
          {mode === 'practice' && (
            <button
              onClick={() => speakQuestion(questions[current])}
              className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
            >
              🔊 Repeat
            </button>
          )}
        </div>
        <p className="text-white text-lg leading-relaxed">{questions[current]}</p>
      </div>

      {/* Answer input — show when no feedback yet */}
      {!feedback && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                answerRef.current = e.target.value;
              }}
              placeholder="Type your answer or use the mic button to speak..."
              rows={6}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? "bg-red-500 hover:bg-red-400 animate-pulse"
                  : transcribing
                  ? "bg-dark-600 cursor-wait"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              {transcribing ? (
                <span className="text-xs text-white">...</span>
              ) : recording ? (
                <span className="text-white text-lg">⏹</span>
              ) : (
                <span className="text-white text-lg">🎤</span>
              )}
            </button>
          </div>

          {recording && (
            <div className="space-y-2">
              <p className="text-red-400 text-sm text-center animate-pulse">
                🔴 Recording... click the button again to stop
              </p>
              {liveTranscript && (
                <div className="bg-dark-600 border border-dark-500 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Live transcript</p>
                  <p className="text-slate-300 text-sm italic">{liveTranscript}</p>
                </div>
              )}
            </div>
          )}

          {transcribing && (
            <p className="text-purple-400 text-sm text-center">⏳ Transcribing your answer...</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
            className={`w-full disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors ${
              mode === 'mock'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {loading ? "Analyzing your answer..." : "Submit Answer"}
          </button>
        </div>
      )}

      {/* Feedback — PRACTICE MODE only */}
      {feedback && mode === 'practice' && (
        <div className="space-y-4">
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">AI Feedback</p>
              <span className="text-2xl font-bold font-mono text-white">
                {feedback.score}<span className="text-slate-500 text-lg">/10</span>
              </span>
            </div>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.feedback}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {current + 1 >= questions.length ? "Complete Session" : "Next Question →"}
          </button>
        </div>
      )}

      {/* MOCK MODE — no feedback, just a status message and auto-advance */}
      {feedback && mode === 'mock' && (
        <div className="space-y-4">
          <div className="bg-dark-700 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm font-medium">✓ Answer recorded</p>
            <p className="text-slate-500 text-xs mt-1">
              {current + 1 >= questions.length
                ? 'Loading your results...'
                : 'Moving to next question...'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}