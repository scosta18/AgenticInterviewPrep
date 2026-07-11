import { useState, useEffect } from 'react'
import { getSession } from '../api/client'

export default function Results({ sessionId, onPracticeAgain, onDashboard }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getSession(sessionId)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return (
    <div className="text-center py-20 text-slate-400">Loading your results...</div>
  )

  if (!data) return (
    <div className="text-center py-20 text-slate-400">Could not load results.</div>
  )

  const { session, questions, average_score, total_questions } = data

  const getMessage = (score) => {
    if (score >= 8) return { text: "Outstanding performance! You're interview-ready. 🔥", color: "text-green-400" }
    if (score >= 6) return { text: "Good effort — a bit more practice and you'll nail it. 💪", color: "text-yellow-400" }
    return { text: "Keep practicing — every session makes you stronger. 📚", color: "text-red-400" }
  }

  const message = getMessage(average_score)

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">Session Complete</p>
        <h1 className="text-3xl font-bold text-white">Your Results</h1>
        <p className="text-slate-400 text-sm">
          {session.company_name} · {session.role} · {session.created_at?.slice(0, 10)}
        </p>
      </div>

      {/* Score card */}
      <div className="bg-dark-700 border border-dark-600 rounded-2xl p-8 text-center space-y-4">
        <p className="text-slate-400 text-sm uppercase tracking-wider">Overall Score</p>
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-36 h-36" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e1e2e" strokeWidth="12" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={average_score >= 8 ? '#22c55e' : average_score >= 6 ? '#a78bfa' : '#ef4444'}
              strokeWidth="12"
              strokeDasharray={`${(average_score / 10) * 339.3} 339.3`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-4xl font-bold font-mono text-white">{average_score}</p>
            <p className="text-slate-500 text-sm">/10</p>
          </div>
        </div>
        <p className={`text-sm font-medium ${message.color}`}>{message.text}</p>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-dark-900 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Questions</p>
            <p className="text-white font-mono font-bold text-xl">{total_questions}</p>
          </div>
          <div className="bg-dark-900 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Best Answer</p>
            <p className="text-white font-mono font-bold text-xl">
              {questions.length ? Math.max(...questions.map(q => q.score || 0)) : 0}/10
            </p>
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Question Breakdown</h2>
        {questions.map((q, i) => (
          <div key={q.id} className="bg-dark-700 border border-dark-600 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-dark-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
                  (q.score || 0) >= 8 ? 'bg-green-500/20 text-green-400' :
                  (q.score || 0) >= 6 ? 'bg-purple-500/20 text-purple-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {q.score || 0}
                </span>
                <p className="text-white text-sm font-medium line-clamp-1">{q.question}</p>
              </div>
              <span className="text-slate-500 text-xs ml-4 flex-shrink-0">
                {expanded === i ? '▲' : '▼'}
              </span>
            </button>

            {expanded === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-dark-600 pt-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Your Answer</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{q.answer || 'No answer recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Feedback</p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{q.feedback}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPracticeAgain}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-colors text-sm"
        >
          Practice Again →
        </button>
        <a
          href={`http://127.0.0.1:8000/sessions/${sessionId}/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-400 hover:text-white rounded-lg transition-colors text-sm flex items-center"
        >
          📄 PDF
        </a>
        <button
          onClick={onDashboard}
          className="px-5 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-400 hover:text-white rounded-lg transition-colors text-sm"
        >
          Dashboard
        </button>
      </div>
    </div>
  )
}