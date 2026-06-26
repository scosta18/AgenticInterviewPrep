import { useState, useEffect } from 'react'
import { getSessions, getSession, getCodingSession } from '../api/client'

export default function Dashboard() {
  const [interviewData, setInterviewData] = useState([])
  const [codingData, setCodingData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await getSessions()
      const completed = res.data.filter(s => s.completed)

      const interviewSessions = completed.filter(s => s.session_type !== 'coding')
      const codingSessions = completed.filter(s => s.session_type === 'coding')

      // Load interview details
      const interviewDetails = await Promise.all(
        interviewSessions.map(s => getSession(s.id).then(r => r.data))
      )

      // Load coding details
      const codingDetails = await Promise.all(
        codingSessions.map(s => getCodingSession(s.id).then(r => r.data))
      )

      const iData = interviewDetails.map((d, i) => ({
        session: `S${i + 1}`,
        company: d.session.company_name,
        role: d.session.role,
        avg_score: d.average_score || 0,
        questions: d.total_questions || 0,
        date: d.session.created_at?.slice(0, 10),
        type: 'interview',
      }))

      const cData = codingDetails.map((d, i) => ({
        session: `C${i + 1}`,
        company: d.session.company_name,
        role: d.session.role,
        avg_score: d.average_score || 0,
        questions: d.total_problems || 0,
        date: d.session.created_at?.slice(0, 10),
        type: 'coding',
      }))

      setInterviewData(iData)
      setCodingData(cData)

      // Stats based on interview sessions only
      const scores = iData.map(d => d.avg_score).filter(s => s > 0)
      if (scores.length > 0) {
        const best = Math.max(...scores)
        const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0
        setStats({
          best,
          overall,
          trend,
          totalInterview: interviewSessions.length,
          totalCoding: codingSessions.length,
        })
      } else if (completed.length > 0) {
        setStats({
          best: 0,
          overall: 0,
          trend: 0,
          totalInterview: interviewSessions.length,
          totalCoding: codingSessions.length,
        })
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="text-center py-20 text-slate-400">Loading dashboard...</div>
  )

  if (!interviewData.length && !codingData.length) return (
    <div className="text-center py-20 text-slate-400">
      No completed sessions yet. Complete your first interview to see progress.
    </div>
  )

  const maxScore = 10
  const maxInterviewQuestions = Math.max(...interviewData.map(d => d.questions), 1)
  const maxCodingQuestions = Math.max(...codingData.map(d => d.questions), 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Progress Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">Track your improvement across sessions</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Interview Sessions</p>
            <p className="text-3xl font-bold font-mono text-white">{stats.totalInterview}</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Coding Sessions</p>
            <p className="text-3xl font-bold font-mono text-blue-400">{stats.totalCoding}</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Overall Avg</p>
            <p className="text-3xl font-bold font-mono text-purple-400">
              {stats.overall > 0 ? `${stats.overall}/10` : '—'}
            </p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Best Session</p>
            <p className="text-3xl font-bold font-mono text-green-400">
              {stats.best > 0 ? `${stats.best}/10` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Interview score chart */}
      {interviewData.length > 0 && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-6">Interview — Average Score Per Session</h2>
          <div className="flex items-end gap-3 h-48">
            {interviewData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-purple-400">{d.avg_score || 0}</span>
                <div className="w-full flex items-end justify-center">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${((d.avg_score || 0) / maxScore) * 160}px`,
                      minHeight: '4px',
                      background: d.avg_score >= 8 ? '#22c55e' : d.avg_score >= 6 ? '#a78bfa' : '#ef4444'
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500">{d.session}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-green-500 inline-block"/> 8-10
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block"/> 6-7
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block"/> 0-5
            </span>
          </div>
        </div>
      )}

      {/* Coding score chart */}
      {codingData.length > 0 && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-6">Coding — Average Score Per Session</h2>
          <div className="flex items-end gap-3 h-48">
            {codingData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-blue-400">{d.avg_score || 0}</span>
                <div className="w-full flex items-end justify-center">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${((d.avg_score || 0) / maxScore) * 160}px`,
                      minHeight: '4px',
                      background: d.avg_score >= 8 ? '#22c55e' : d.avg_score >= 6 ? '#3b82f6' : '#ef4444'
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500">{d.session}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview session list */}
      {interviewData.length > 0 && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Interview Sessions</h2>
          <div className="space-y-2">
            {interviewData.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-dark-600 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{d.company}</p>
                  <p className="text-slate-500 text-xs">{d.role} · {d.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">{d.questions} questions</span>
                  <span className={`font-mono font-bold text-sm ${
                    d.avg_score >= 8 ? 'text-green-400' :
                    d.avg_score >= 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {d.avg_score > 0 ? `${d.avg_score}/10` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coding session list */}
      {codingData.length > 0 && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Coding Sessions</h2>
          <div className="space-y-2">
            {codingData.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-dark-600 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{d.role}</p>
                  <p className="text-slate-500 text-xs">{d.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">{d.questions} problems</span>
                  <span className={`font-mono font-bold text-sm ${
                    d.avg_score >= 8 ? 'text-green-400' :
                    d.avg_score >= 6 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {d.avg_score > 0 ? `${d.avg_score}/10` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}