import { useState, useEffect, useRef } from 'react'
import { submitAnswer, completeSession, transcribeAudio, speakText } from '../api/client'

export default function Interview({ sessionData, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState([])
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    const raw = sessionData.questions_raw || ''
    const lines = raw.split('\n').filter(l => l.trim())
    const parsed = []
    for (const line of lines) {
      if (/^\d+[\.\)]/.test(line.trim())) {
        const q = line.replace(/^\d+[\.\)]\s*/, '').replace(/\*\*/g, '').trim()
        if (q.length > 20) parsed.push(q)
      }
    }
    setQuestions(parsed.length ? parsed : [raw])
  }, [sessionData])

  useEffect(() => {
    if (questions.length > 0 && questions[current]) {
      speakQuestion(questions[current])
    }
  }, [current, questions])

  const speakQuestion = async (text) => {
    try {
      const res = await speakText(text)
      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      audio.play()
    } catch (err) {
      console.error('Speech failed:', err)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await handleTranscribe(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      alert('Microphone access denied. Please allow mic access and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const handleTranscribe = async (blob) => {
    setTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'answer.webm')
      const res = await transcribeAudio(formData)
      setAnswer(prev => prev ? prev + ' ' + res.data.text : res.data.text)
    } catch (err) {
      console.error('Transcription failed:', err)
      alert('Transcription failed. Try typing your answer instead.')
    } finally {
      setTranscribing(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await submitAnswer({
        session_id: sessionData.session_id,
        question: questions[current],
        answer: answer,
        company_name: 'the company',
        role: 'the role'
      })
      setFeedback(res.data)
      setScores(prev => [...prev, res.data.score])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      handleComplete()
    } else {
      setCurrent(prev => prev + 1)
      setAnswer('')
      setFeedback(null)
    }
  }

  const handleComplete = async () => {
    await completeSession(sessionData.session_id)
    onComplete()
  }

  if (!questions.length) return (
    <div className="text-center py-20 text-slate-400">Loading questions...</div>
  )

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Question {current + 1} of {questions.length}
        </span>
        {avgScore !== null && (
          <span className="text-sm text-purple-400 font-mono">
            Avg score: {avgScore}/10
          </span>
        )}
      </div>

      <div className="w-full bg-dark-700 rounded-full h-1.5">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">
            Question {current + 1}
          </p>
          <button
            onClick={() => speakQuestion(questions[current])}
            className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
            title="Repeat question"
          >
            🔊 Repeat
          </button>
        </div>
        <p className="text-white text-lg leading-relaxed">
          {questions[current]}
        </p>
      </div>

      {/* Answer */}
      {!feedback && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer or use the mic button to speak..."
              rows={6}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />

            {/* Mic button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                  : transcribing
                  ? 'bg-dark-600 cursor-wait'
                  : 'bg-purple-600 hover:bg-purple-500'
              }`}
              title={recording ? 'Stop recording' : 'Start voice input'}
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
            <p className="text-red-400 text-sm text-center animate-pulse">
              🔴 Recording... click the button again to stop
            </p>
          )}

          {transcribing && (
            <p className="text-purple-400 text-sm text-center">
              ⏳ Transcribing your answer...
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Analyzing your answer...' : 'Submit Answer'}
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="space-y-4">
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">
                AI Feedback
              </p>
              <span className="text-2xl font-bold font-mono text-white">
                {feedback.score}
                <span className="text-slate-500 text-lg">/10</span>
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
            {current + 1 >= questions.length ? 'Complete Session' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}