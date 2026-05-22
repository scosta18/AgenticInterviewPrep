import { useState, useEffect } from 'react'
import { submitAnswer, completeSession } from '../api/client'

export default function Interview({ sessionData, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [scores, setScores] = useState([])

  useEffect(() => {
    // Parse questions from raw text
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
    setSessionDone(true)
    onComplete()
  }

  if (!questions.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        Loading questions...
      </div>
    )
  }

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
          style={{ width: `${((current) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
        <p className="text-xs text-purple-400 font-mono uppercase tracking-wider mb-3">
          Question {current + 1}
        </p>
        <p className="text-white text-lg leading-relaxed">
          {questions[current]}
        </p>
      </div>

      {/* Answer */}
      {!feedback && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here as if you're in the real interview..."
            rows={6}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
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