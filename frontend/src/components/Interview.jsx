import { useState, useEffect, useRef } from "react";
import {
  submitAnswer,
  completeSession,
  speakText,
  getDeepgramKey,
  prefetchSpeak,
} from "../api/client";

// AI Interviewer Silhouette SVG
function InterviewerAvatar({ state }) {
  // state: 'speaking' | 'listening' | 'idle'
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative ${state === 'speaking' ? 'animate-pulse' : ''}`}>
        {/* Glow ring when speaking */}
        {state === 'speaking' && (
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl scale-150 animate-pulse" />
        )}
        {/* Silhouette face */}
        <svg width="180" height="200" viewBox="0 0 180 200" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="90" cy="75" rx="50" ry="60"
            fill="url(#faceGradient)"
            className={state === 'listening' ? '' : ''}
          />
          {/* Neck */}
          <rect x="72" y="128" width="36" height="28" rx="8" fill="url(#faceGradient)" />
          {/* Shoulders */}
          <ellipse cx="90" cy="185" rx="75" ry="30" fill="url(#shoulderGradient)" />
          {/* Suit collar left */}
          <path d="M72 155 L50 185 L90 175 Z" fill="#1a1a2e" />
          {/* Suit collar right */}
          <path d="M108 155 L130 185 L90 175 Z" fill="#0f0f1a" />
          {/* Tie */}
          <path d="M86 158 L90 175 L94 158 L90 153 Z" fill="#6d28d9" />

          {/* Eyes - subtle highlights */}
          <ellipse cx="72" cy="68" rx="8" ry="9" fill="#0a0a14" />
          <ellipse cx="108" cy="68" rx="8" ry="9" fill="#0a0a14" />
          <ellipse cx="70" cy="66" rx="2.5" ry="3" fill="white" opacity="0.3" />
          <ellipse cx="106" cy="66" rx="2.5" ry="3" fill="white" opacity="0.3" />

          {/* Mouth */}
          {state === 'speaking' ? (
            // Open mouth when speaking
            <ellipse cx="90" cy="100" rx="12" ry="7" fill="#0a0a14" />
          ) : (
            // Neutral mouth
            <path d="M78 100 Q90 106 102 100" stroke="#0a0a14" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}

          {/* Nose */}
          <path d="M87 80 L84 95 Q90 98 96 95 L93 80" stroke="#0a0a14" strokeWidth="1.5" fill="none" opacity="0.5" />

          {/* Ear left */}
          <ellipse cx="40" cy="75" rx="8" ry="12" fill="url(#faceGradient)" />
          {/* Ear right */}
          <ellipse cx="140" cy="75" rx="8" ry="12" fill="url(#faceGradient)" />

          <defs>
            <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d2d3f" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
            <linearGradient id="shoulderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="50%" stopColor="#2d2d3f" />
              <stop offset="100%" stopColor="#0f0f1a" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Sound wave when speaking */}
      {state === 'speaking' && (
        <div className="flex items-center gap-1 mt-3">
          {[3, 6, 9, 12, 9, 6, 3].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-purple-400 rounded-full animate-pulse"
              style={{
                height: `${h * 2}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}

      {/* Listening indicator */}
      {state === 'listening' && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-green-400 text-xs font-mono">Listening...</p>
        </div>
      )}

      {/* Idle indicator */}
      {state === 'idle' && (
        <div className="mt-3">
          <p className="text-slate-600 text-xs font-mono">AI Interviewer</p>
        </div>
      )}
    </div>
  )
}

export default function Interview({ sessionData, onComplete, mode = 'practice', interview_type = 'behavioral' }) {
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
  const [avatarState, setAvatarState] = useState('idle');
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
    setAvatarState('speaking');
    try {
      if (prefetchedAudioRef.current) {
        const audioBytes = Uint8Array.from(atob(prefetchedAudioRef.current), (c) => c.charCodeAt(0));
        const blob = new Blob([audioBytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setAvatarState('listening');
        audio.play();
        prefetchedAudioRef.current = null;
        return;
      }
      const res = await speakText(text);
      const url = URL.createObjectURL(res.data);
      const audio = new Audio(url);
      audio.onended = () => setAvatarState('listening');
      audio.play();
    } catch (err) {
      console.error("Speech failed:", err);
      setAvatarState('listening');
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
    setAvatarState('idle');
    try {
      const res = await submitAnswer({
        session_id: sessionData.session_id,
        question: questions[current],
        answer: answerText,
        company_name: "the company",
        role: "the role",
        interview_type: interview_type,
      });
      feedbackRef.current = res.data;
      setFeedback(res.data);
      setScores((prev) => [...prev, res.data.score]);

      const nextIndex = current + 1;
      if (nextIndex < questions.length) {
        prefetchNextQuestion(nextIndex);
      }

      // In mock mode, auto-advance after short delay
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
    setAvatarState('idle');
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

  // ── MOCK MODE LAYOUT ──────────────────────────────────────────────────────
  if (mode === 'mock') {
    return (
      <div className="relative min-h-[70vh] flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-red-400 font-mono border border-red-500/30 px-2 py-0.5 rounded">
              🎯 Mock Interview
            </span>
            <span className="text-sm text-slate-400">
              Question {current + 1} of {questions.length}
            </span>
          </div>
          {timeLeft !== null && (
            <span className="text-sm font-mono font-bold text-red-400 animate-pulse">
              ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-dark-700 rounded-full h-1 mb-8">
          <div
            className="bg-red-500 h-1 rounded-full transition-all"
            style={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>

        {/* Avatar — center stage */}
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <InterviewerAvatar state={avatarState} />

          {avatarState === 'speaking' && (
            <p className="text-slate-400 text-sm mt-6 text-center max-w-sm">
              Listen carefully — you won't see the question written down.
            </p>
          )}

          {/* Live transcript in mock mode */}
          {liveTranscript && (
            <div className="mt-6 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 max-w-md w-full">
              <p className="text-xs text-slate-500 mb-1">Live transcript</p>
              <p className="text-slate-300 text-sm italic">{liveTranscript}</p>
            </div>
          )}

          {feedback && (
            <div className="mt-6 bg-dark-700 border border-red-500/20 rounded-xl p-4 text-center max-w-sm w-full">
              <p className="text-red-400 text-sm font-medium">✓ Answer recorded</p>
              <p className="text-slate-500 text-xs mt-1">
                {current + 1 >= questions.length ? 'Loading your results...' : 'Moving to next question...'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        {!feedback && (
          <div className="flex items-center justify-between pt-4 border-t border-dark-600">
            <div className="text-slate-500 text-xs">
              {recording
                ? <span className="text-red-400 animate-pulse">🔴 Recording...</span>
                : avatarState === 'listening'
                ? 'Your turn to answer'
                : 'Wait for the question...'}
            </div>
            <div className="flex items-center gap-3">
              {answer && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-dark-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? '...' : 'Submit →'}
                </button>
              )}
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing || avatarState === 'speaking'}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  recording
                    ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                    : avatarState === 'speaking'
                    ? 'bg-dark-600 cursor-not-allowed opacity-50'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {recording ? <span className="text-white text-lg">⏹</span> : <span className="text-white text-lg">🎤</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── PRACTICE MODE LAYOUT ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <span className={`text-sm font-mono font-bold ${
              timeLeft <= 30 ? 'text-red-400 animate-pulse'
              : timeLeft <= 60 ? 'text-yellow-400'
              : 'text-green-400'
            }`}>
              ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          )}
          {avgScore !== null && (
            <span className="text-sm text-purple-400 font-mono">Avg: {avgScore}/10</span>
          )}
        </div>
      </div>

      <div className="w-full bg-dark-700 rounded-full h-1.5">
        <div className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(current / questions.length) * 100}%` }} />
      </div>

      {/* Avatar + Question side by side */}
      <div className="flex gap-6 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <InterviewerAvatar state={avatarState} />
        </div>

        {/* Question card */}
        <div className="flex-1 bg-dark-700 border border-dark-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">
              Question {current + 1}
            </p>
            <button
              onClick={() => speakQuestion(questions[current])}
              className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
            >
              🔊 Repeat
            </button>
          </div>
          <p className="text-white text-lg leading-relaxed">{questions[current]}</p>
        </div>
      </div>

      {/* Answer */}
      {!feedback && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); answerRef.current = e.target.value; }}
              placeholder="Type your answer or use the mic button to speak..."
              rows={6}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                recording ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                : transcribing ? 'bg-dark-600 cursor-wait'
                : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              {transcribing ? <span className="text-xs text-white">...</span>
                : recording ? <span className="text-white text-lg">⏹</span>
                : <span className="text-white text-lg">🎤</span>}
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
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "Analyzing your answer..." : "Submit Answer"}
          </button>
        </div>
      )}

      {/* Feedback — practice mode only */}
      {feedback && (
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
    </div>
  );
}