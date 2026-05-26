import { useState } from 'react'
import { startSession } from '../api/client'

export default function Setup({ onSessionStart }) {
  const [form, setForm] = useState({
    company_name: '',
    role: '',
    job_description: '',
    company_context: '',
    num_questions: 5
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.company_name || !form.role || !form.job_description) {
      setError('Please fill in company name, role, and job description.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await startSession({
        ...form,
        num_questions: parseInt(form.num_questions)
      })
      onSessionStart(res.data)
    } catch (err) {
      setError('Failed to start session. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Interview Session</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Enter the job details and your AI coach will prepare targeted questions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 block mb-1.5">Company Name</label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="e.g. Lumiture"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1.5">Role</label>
          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            placeholder="e.g. Data/AI Full Stack Engineer"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Question count selector */}
      <div>
        <label className="text-sm text-slate-400 block mb-2">Number of Questions</label>
        <div className="flex gap-3">
          {[3, 5, 10, 15].map(n => (
            <button
              key={n}
              onClick={() => setForm({ ...form, num_questions: n })}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                form.num_questions === n
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-dark-700 border-dark-600 text-slate-400 hover:border-dark-500'
              }`}
            >
              {n === 3 ? '3 — Quick' : n === 5 ? '5 — Standard' : n === 10 ? '10 — Full' : '15 — Intensive'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1.5">Job Description</label>
        <textarea
          name="job_description"
          value={form.job_description}
          onChange={handleChange}
          placeholder="Paste the full job description here..."
          rows={8}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono text-sm"
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1.5">
          Company Context <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          name="company_context"
          value={form.company_context}
          onChange={handleChange}
          placeholder="Add anything you know about the company, interviewer, culture..."
          rows={4}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
      >
        {loading ? '🔍 Researching and generating questions...' : `Start Session — ${form.num_questions} Questions`}
      </button>
    </div>
  )
}