import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
// import { generateProblem, reviewCode, speakText, getDeepgramKey, getHint, startCodingSession, completeSession } from '../api/client'
import { generateProblem, reviewCode, speakText, getDeepgramKey, getHint, startCodingSession, completeSession, getNextDifficulty } from '../api/client'

const LANGUAGES = ['python', 'javascript', 'java', 'cpp']
const DIFFICULTIES = ['easy', 'medium', 'hard']

const STARTERS = {
  python: '# Write your solution here\ndef solution():\n    pass\n',
  javascript: '// Write your solution here\nfunction solution() {\n\n}\n',
  java: '// Write your solution here\nclass Solution {\n    public void solution() {\n\n    }\n}\n',
  cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}\n',
}

const getStarterCode = (lang, problem) => {
  const signature = problem?.function_signature?.[lang]
  if (signature) {
    if (lang === 'python') return `${signature}\n    pass\n`
    if (lang === 'javascript' || lang === 'java' || lang === 'cpp') {
      return `${signature.replace(/\{\s*\}/, '{\n    \n}')}\n`
    }
    return `${signature}\n`
  }
  return STARTERS[lang]
}

// Commands the voice listener watches for
const COMMANDS = {
  hint: ['hint', 'give me a hint', 'i need a hint', 'help me'],
  submit: ['submit', 'done', 'i am done', "i'm done", 'submit for review'],
  repeat: ['repeat', 'repeat the problem', 'read the problem'],
  reset: ['new problem', 'next problem', 'reset'],
}

const detectCommand = (transcript) => {
  const lower = transcript.toLowerCase().trim()
  for (const [command, phrases] of Object.entries(COMMANDS)) {
    if (phrases.some(p => lower.includes(p))) return command
  }
  return null
}

export default function CodingInterview() {
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [language, setLanguage] = useState('python')
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState(STARTERS.python)
  const [sessionId, setSessionId] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [review, setReview] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [nextMessage, setNextMessage] = useState('')
  const [loadingNext, setLoadingNext] = useState(false)

  // Voice state
  const [listening, setListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [voiceStatus, setVoiceStatus] = useState('')
  const [hinting, setHinting] = useState(false)

  const mediaRecorderRef = useRef(null)
  const deepgramSocketRef = useRef(null)
  const codeRef = useRef(code)
  const problemRef = useRef(problem)
  const reviewingRef = useRef(reviewing)
  const commandCooldownRef = useRef(false)

  // Keep refs in sync
  useEffect(() => { codeRef.current = code }, [code])
  useEffect(() => { problemRef.current = problem }, [problem])
  useEffect(() => { reviewingRef.current = reviewing }, [reviewing])

  // Speak problem when it loads
  useEffect(() => {
    if (problem?.description) {
      speakTextAloud(`Here is your coding problem: ${problem.title}. ${problem.description}`)
    }
  }, [problem])

  const speakTextAloud = async (text) => {
    try {
      const res = await speakText(text)
      const url = URL.createObjectURL(res.data)
      new Audio(url).play()
    } catch (err) {
      console.error('TTS failed:', err)
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(getStarterCode(lang, problem))
  }

  const handleGenerate = async () => {
    if (!role.trim()) {
      setError('Please enter a role first.')
      return
    }
    setError('')
    setGenerating(true)
    setProblem(null)
    setReview(null)
    setCode(STARTERS[language])
    try {
      const sessionRes = await startCodingSession({ role, company_name: 'Interview' })
      setSessionId(sessionRes.data.session_id)
      const res = await generateProblem({ role, difficulty })
      setProblem(res.data.problem)
      setCode(getStarterCode(language, res.data.problem))
    } catch (err) {
      setError('Failed to generate problem. Check backend is running.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handleReview = async () => {
    if (!problemRef.current || reviewingRef.current) return
    setReviewing(true)
    setReview(null)
    try {
      const res = await reviewCode({
        session_id: sessionId,
        problem_title: problemRef.current.title,
        problem_description: problemRef.current.description,
        difficulty: problemRef.current.difficulty,
        code: codeRef.current,
        language,
      })
      setReview(res.data)

      if(sessionId){
        await completeSession(sessionId).catch(console.error)
      }
    } catch (err) {
      setError('Review failed.')
      console.error(err)
    } finally {
      setReviewing(false)
    }
  }

  const handleHint = async () => {
    if (!problemRef.current || hinting) return;
    setHinting(true);
    setVoiceStatus("Getting hint...");
    try {
      const res = await getHint({
        problem_title: problemRef.current.title,
        problem_description: problemRef.current.description,
        code: codeRef.current,
        language,
      });
      const hint = res.data.hint;
      setVoiceStatus(`💡 Hint: ${hint}`);
      await speakTextAloud(hint);
    } catch (err) {
      setVoiceStatus("Hint failed.");
      console.error(err);
    } finally {
      setHinting(false);
    }
  };

  const handleNextProblem = async () => {
    if (!review || !problem) return;
    setLoadingNext(true);
    setNextMessage("");
    try {
      const diffRes = await getNextDifficulty({
        score: review.score,
        current_difficulty: problem.difficulty,
      });

      const nextDifficulty = diffRes.data.next_difficulty;
      const message = diffRes.data.message;

      console.log(
        `Score: ${review.score} | ${problem.difficulty} → ${nextDifficulty}`,
      ); // moved here

      setNextMessage(message);
      speakTextAloud(message);

      await new Promise((res) => setTimeout(res, 1500));

      const sessionRes = await startCodingSession({
        role,
        company_name: "Interview",
      });
      setSessionId(sessionRes.data.session_id);

      setReview(null);
      setProblem(null);
      setCode(STARTERS[language]);

      const probRes = await generateProblem({
        role,
        difficulty: nextDifficulty,
      });
      setDifficulty(nextDifficulty);
      setProblem(probRes.data.problem);
      setCode(getStarterCode(language, probRes.data.problem));
    } catch (err) {
      console.error("Next problem failed", err);
      setError("Failed to load next problem");
    } finally {
      setLoadingNext(false);
      setNextMessage("");
    }
  };

  const handleReset = () => {
    setProblem(null);
    setReview(null);
    setSessionId(null);
    setCode(STARTERS[language]);
    setError("");
    setVoiceStatus("");
    setLiveTranscript("");
  };

  // Voice command dispatcher
  const dispatchCommand = (command) => {
    if (commandCooldownRef.current) return
    commandCooldownRef.current = true
    setTimeout(() => { commandCooldownRef.current = false }, 2000)

    setLiveTranscript('')
    setVoiceStatus(`Command: ${command}`)

    if (command === 'hint') handleHint()
    if (command === 'submit') handleReview()
    if (command === 'repeat' && problemRef.current) {
      speakTextAloud(`${problemRef.current.title}. ${problemRef.current.description}`)
    }
    if (command === 'reset') handleReset()
  }

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      const keyRes = await getDeepgramKey()
      const apiKey = keyRes.data.key

      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true`,
        ['token', apiKey]
      )
      deepgramSocketRef.current = socket

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data)
        const transcript = data?.channel?.alternatives?.[0]?.transcript
        const isFinal = data?.is_final

        if (transcript) {
          if (isFinal) {
            const command = detectCommand(transcript)
            if (command) {
              dispatchCommand(command)
            } else {
              setLiveTranscript(transcript)
            }
          } else {
            setLiveTranscript(transcript)
          }
        }
      }

      socket.onerror = (e) => console.error('Deepgram WS error:', e)
      socket.onclose = () => setListening(false)

      await new Promise((resolve, reject) => {
        socket.onopen = resolve
        setTimeout(() => reject(new Error('WebSocket timeout')), 5000)
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (deepgramSocketRef.current) deepgramSocketRef.current.close()
        stream.getTracks().forEach(t => t.stop())
        setLiveTranscript('')
      }

      mediaRecorder.start(250)
      setListening(true)
      setVoiceStatus('Listening for commands...')

    } catch (err) {
      console.error('Voice error:', err)
      setVoiceStatus('Microphone access failed.')
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
    setListening(false)
    setVoiceStatus('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Coding Interview</h1>
        <p className="text-slate-400 mt-1 text-sm">
          AI generates a role-targeted problem — write your solution and get
          scored feedback on your thinking.
        </p>
      </div>

      {/* Config */}
      {!problem && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">
              Your Role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Engineer, Data Scientist"
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      difficulty === d
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-dark-900 border-dark-600 text-slate-400 hover:border-dark-500"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Language
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === l
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-dark-900 border-dark-600 text-slate-400 hover:border-dark-500"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {generating ? "⚙️ Generating problem..." : "Generate Problem"}
          </button>
        </div>
      )}

      {/* Problem */}
      {problem && (
        <div className="space-y-4">
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg">
                  {problem.title}
                </h2>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded mt-1 inline-block ${
                    problem.difficulty === "easy"
                      ? "text-green-400 bg-green-400/10"
                      : problem.difficulty === "medium"
                        ? "text-yellow-400 bg-yellow-400/10"
                        : "text-red-400 bg-red-400/10"
                  }`}
                >
                  {problem.difficulty}
                </span>
              </div>
              <button
                onClick={() =>
                  speakTextAloud(`${problem.title}. ${problem.description}`)
                }
                className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
              >
                🔊 Repeat
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {problem.description}
            </p>

            {problem.examples?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Examples
                </p>
                {problem.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-dark-900 rounded-lg p-3 font-mono text-xs space-y-1"
                  >
                    <p className="text-slate-400">
                      Input:{" "}
                      <span className="text-white">
                        {JSON.stringify(ex.input)}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Output:{" "}
                      <span className="text-white">
                        {JSON.stringify(ex.output)}
                      </span>
                    </p>
                    {ex.explanation && (
                      <p className="text-slate-500">{ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints?.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Constraints
                </p>
                <ul className="space-y-1">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="text-slate-400 text-xs font-mono">
                      • {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  language === l
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-dark-700 border-dark-600 text-slate-400 hover:border-dark-500"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Monaco editor */}
          <div className="rounded-xl overflow-hidden border border-dark-600">
            <Editor
              height="320px"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                tabSize: 4,
              }}
            />
          </div>

          {/* Voice command bar */}
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4 flex items-center gap-4">
            <button
              onClick={listening ? stopListening : startListening}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                listening
                  ? "bg-red-500 hover:bg-red-400 animate-pulse"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              {listening ? "⏹" : "🎤"}
            </button>

            <div className="flex-1 min-w-0">
              {voiceStatus && (
                <p className="text-xs text-purple-400 mb-1">{voiceStatus}</p>
              )}
              {liveTranscript && (
                <p className="text-xs text-slate-400 italic truncate">
                  {liveTranscript}
                </p>
              )}
              {!voiceStatus && !liveTranscript && (
                <p className="text-xs text-slate-600">
                  Say: "hint", "submit", "repeat", or "new problem"
                </p>
              )}
            </div>

            <button
              onClick={handleHint}
              disabled={hinting}
              className="text-xs text-slate-400 hover:text-yellow-400 transition-colors px-2 py-1 rounded border border-dark-600 hover:border-yellow-400/30 flex-shrink-0"
            >
              💡 Hint
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReview}
              disabled={reviewing}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {reviewing ? "⏳ Reviewing..." : "🧠 Submit for Review"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              New Problem
            </button>
          </div>

          {/* Review */}
          {review && (
            <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">
                  AI Review
                </p>
                <span className="text-2xl font-bold font-mono text-white">
                  {review.score}
                  <span className="text-slate-500 text-lg">/10</span>
                </span>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {review.feedback}
              </div>

              {nextMessage && (
                <div className="bg-dark-900 border border-purple-500/30 rounded-lg px-4 py-3">
                  <p className="text-purple-400 text-sm">{nextMessage}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleNextProblem}
                  disabled={loadingNext}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {loadingNext
                    ? "⏳ Loading next problem..."
                    : "Next Problem →"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-400 hover:text-white rounded-lg transition-colors text-sm"
                >
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}