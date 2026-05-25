import { useState, useEffect } from 'react'
import { getSessions, getSession } from '../api/client'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions()
      .then(res => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (session) => {
    setSelected(session.id)
    const res = await getSession(session.id)
    setDetail(res.data)
  }

  if (loading) return (
    <div className="text-center py-20 text-slate-400">Loading sessions...</div>
  )

  if (!sessions.length) return (
    <div className="text-center py-20 text-slate-400">
      No sessions yet. Start your first interview prep session.
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Session History</h1>

      <div className="grid grid-cols-3 gap-3">
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className={`text-left p-4 rounded-xl border transition-colors ${
              selected === s.id
                ? 'border-purple-500 bg-dark-700'
                : 'border-dark-600 bg-dark-700 hover:border-dark-500'
            }`}
          >
            <p className="text-white font-medium text-sm">{s.company_name}</p>
            <p className="text-slate-400 text-xs mt-1">{s.role}</p>
            <p className="text-slate-600 text-xs mt-2">
              {new Date(s.created_at).toLocaleDateString()}
            </p>
            {s.completed ? (
              <span className="text-xs text-green-400 mt-1 block">✓ Completed</span>
            ) : (
              <span className="text-xs text-yellow-400 mt-1 block">In Progress</span>
            )}
          </button>
        ))}
      </div>

      {detail && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {detail.session.company_name} — {detail.session.role}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-purple-400 font-mono text-sm">
                Avg: {detail.average_score}/10
              </span>
              <a
                href={`http://localhost:8000/sessions/${detail.session.id}/report`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Download PDF
              </a>
            </div>
          </div>

          {detail.questions.map((q, i) => (
            <div key={q.id} className="bg-dark-700 border border-dark-600 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <p className="text-white text-sm font-medium">{q.question}</p>
                <span className="text-purple-400 font-mono text-sm shrink-0">
                  {q.score}/10
                </span>
              </div>
              <p className="text-slate-400 text-sm">{q.answer}</p>
              <div className="border-t border-dark-600 pt-3">
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {q.feedback}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}