import { useState, useEffect } from 'react'
import { getSessions, getSession } from '../api/client'

export default function Dashboard() {
  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await getSessions()
      const allSessions = res.data.filter(s => s.completed)

      const details = await Promise.all(
        allSessions.map(s => getSession(s.id).then(r => r.data))
      )

      const data = details.map((d, i) => ({
        session: `S${i + 1}`,
        company: d.session.company_name,
        role: d.session.role,
        avg_score: d.average_score,
        questions: d.total_questions,
        date: d.session.created_at?.slice(0, 10)
      }))

      setChartData(data)

      if (data.length > 0) {
        const scores = data.map(d => d.avg_score).filter(s => s > 0)
        const best = Math.max(...scores)
        const worst = Math.min(...scores)
        const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0
        setStats({ best, worst, overall, trend, total: allSessions.length })
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

  if (!chartData.length) return (
    <div className="text-center py-20 text-slate-400">
      No completed sessions yet. Complete your first interview to see progress.
    </div>
  )

  const maxScore = 10
  const maxQuestions = Math.max(...chartData.map(d => d.questions))

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
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Sessions</p>
            <p className="text-3xl font-bold font-mono text-white">{stats.total}</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Overall Avg</p>
            <p className="text-3xl font-bold font-mono text-purple-400">{stats.overall}/10</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Best Session</p>
            <p className="text-3xl font-bold font-mono text-green-400">{stats.best}/10</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Trend</p>
            <p className={`text-3xl font-bold font-mono ${
              stats.trend > 0 ? 'text-green-400' : stats.trend < 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {stats.trend > 0 ? '+' : ''}{Math.round(stats.trend * 10) / 10}
            </p>
          </div>
        </div>
      )}

      {/* Score chart — CSS bars */}
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-6">Average Score Per Session</h2>
        <div className="flex items-end gap-3 h-48">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-purple-400">{d.avg_score}</span>
              <div className="w-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(d.avg_score / maxScore) * 160}px`,
                    background: d.avg_score >= 8
                      ? '#22c55e'
                      : d.avg_score >= 6
                      ? '#a78bfa'
                      : '#ef4444'
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

      {/* Questions chart — CSS bars */}
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-6">Questions Per Session</h2>
        <div className="flex items-end gap-3 h-32">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{d.questions}</span>
              <div className="w-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-md bg-purple-600"
                  style={{ height: `${(d.questions / maxQuestions) * 100}px` }}
                />
              </div>
              <span className="text-xs text-slate-500">{d.session}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-4">All Sessions</h2>
        <div className="space-y-2">
          {chartData.map((d, i) => (
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
                  {d.avg_score}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}