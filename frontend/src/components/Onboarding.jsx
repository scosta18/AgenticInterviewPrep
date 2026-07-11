import { useState } from 'react'
import { startSession, uploadResume } from '../api/client'

const FIELDS = [
  { id: 'cs', label: 'Computer Science / Software Engineering', icon: '💻', technical: true },
  { id: 'data', label: 'Data Science / AI / ML', icon: '🧠', technical: true },
  { id: 'engineering', label: 'Engineering (non-CS)', icon: '⚙️', technical: true },
  { id: 'business', label: 'Business / Finance / Accounting', icon: '📊', technical: false },
  { id: 'marketing', label: 'Marketing / Communications', icon: '📣', technical: false },
  { id: 'healthcare', label: 'Healthcare / Biology / Pre-med', icon: '🏥', technical: false },
  { id: 'other', label: 'Other', icon: '🎓', technical: false },
]

const PREP_TYPES = [
  { id: 'job', label: 'Job Interview', icon: '💼' },
  { id: 'internship', label: 'Internship', icon: '🎯' },
  { id: 'grad', label: 'Graduate School', icon: '🎓' },
]

export default function Onboarding({ onSessionStart }) {
  const [step, setStep] = useState(1)
  const [field, setField] = useState(null)
  const [prepType, setPrepType] = useState(null)
  const [interviewType, setInterviewType] = useState('behavioral')
  const [mode, setMode] = useState('practice')
  const [form, setForm] = useState({
    company_name: '',
    role: '',
    job_description: '',
    company_context: '',
    num_questions: 5,
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedField = FIELDS.find(f => f.id === field)
  const isTechnical = selectedField?.technical || false

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return ''
    const formData = new FormData()
    formData.append('file', file)
    const response = await uploadResume(formData)
    return response.data.resume_text
  }

  const handleNext = () => {
    if (step === 1) {
      if (!field || !prepType) {
        setError('Please select your field and what you are preparing for.')
        return
      }
      if (!isTechnical) setInterviewType('behavioral')
    }
    if (step === 2) {
      if (interviewType === 'behavioral' && (!form.company_name || !form.role || !form.job_description)) {
        setError('Please fill in company name, role, and job description.')
        return
      }
      if (interviewType === 'coding' && (!form.company_name || !form.role)) {
        setError('Please fill in company name and role.')
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(step - 1)
  }

  const handleStart = async () => {
    setLoading(true)
    setError('')
    try {
      let resumeText = ''
      if (file) {
        resumeText = await handleUpload()
      }

      if (interviewType === 'coding') {
        onSessionStart({ type: 'coding', field, prepType, mode })
        return
      }

      const res = await startSession({
        ...form,
        resume_text: resumeText,
        num_questions: parseInt(form.num_questions),
      })
      onSessionStart({ ...res.data, type: 'behavioral', mode })
    } catch (err) {
      setError('Failed to start session. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Step {step} of 3</span>
          <span>{step === 1 ? 'Your background' : step === 2 ? 'Interview details' : 'Resume & start'}</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-1.5">
          <div
            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1 — Field + prep type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">What's your background?</h1>
            <p className="text-slate-400 mt-1 text-sm">We'll tailor your interview experience to your field.</p>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-3">Your field or major</label>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setField(f.id)}
                  className={`text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                    field === f.id
                      ? 'bg-purple-600/10 border-purple-500 text-white'
                      : 'bg-dark-700 border-dark-600 text-slate-400 hover:border-dark-500'
                  }`}
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-sm font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-3">What are you preparing for?</label>
            <div className="flex gap-3">
              {PREP_TYPES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPrepType(p.id)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-1.5 ${
                    prepType === p.id
                      ? 'bg-purple-600/10 border-purple-500 text-white'
                      : 'bg-dark-700 border-dark-600 text-slate-400 hover:border-dark-500'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleNext}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2 — Interview details */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Interview details</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Tell us about the role. The AI will research the company and generate targeted questions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Company Name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="e.g. Google"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Role</label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Interview type — only for technical fields */}
          {isTechnical && (
            <div>
              <label className="text-sm text-slate-400 block mb-2">Interview type</label>
              <div className="flex gap-3">
                {[
                  { id: 'behavioral', label: 'Behavioral', icon: '🎤', desc: 'Voice Q&A, feedback scoring' },
                  { id: 'coding', label: 'Coding', icon: '💻', desc: 'Monaco editor, AI review' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setInterviewType(t.id)}
                    className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                      interviewType === t.id
                        ? 'bg-purple-600/10 border-purple-500'
                        : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-xl block mb-1">{t.icon}</span>
                    <p className="text-white text-sm font-medium">{t.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode selector — only for behavioral */}
          {interviewType === 'behavioral' && (
            <div>
              <label className="text-sm text-slate-400 block mb-2">Session mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('practice')}
                  className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                    mode === 'practice'
                      ? 'bg-purple-600/10 border-purple-500'
                      : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <span className="text-xl block mb-1">📚</span>
                  <p className="text-white text-sm font-medium">Practice</p>
                  <p className="text-slate-500 text-xs mt-0.5">Feedback after each question, hints available, relaxed timer</p>
                </button>
                <button
                  onClick={() => setMode('mock')}
                  className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                    mode === 'mock'
                      ? 'bg-red-500/10 border-red-500'
                      : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <span className="text-xl block mb-1">🎯</span>
                  <p className="text-white text-sm font-medium">Mock Interview</p>
                  <p className="text-slate-500 text-xs mt-0.5">No feedback until the end, strict timer, real interview pressure</p>
                </button>
              </div>
              {mode === 'mock' && (
                <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                  <p className="text-red-400 text-xs">
                    ⚠️ Mock mode: no feedback between questions, strict auto-submit timer, full debrief at the end only.
                  </p>
                </div>
              )}
            </div>
          )}

          {interviewType === 'behavioral' && (
            <>
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
                  rows={6}
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
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
                />
              </div>
            </>
          )}

          {interviewType === 'coding' && (
            <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
              <p className="text-slate-300 text-sm">
                💻 Coding interview mode will open after you continue. The AI will generate
                role-targeted problems with adaptive difficulty based on your performance.
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-6 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Resume + start */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Almost ready</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Upload your resume so the AI can tailor questions to your background.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Session summary</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Field</span>
              <span className="text-white text-sm">{selectedField?.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Preparing for</span>
              <span className="text-white text-sm capitalize">{prepType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Company</span>
              <span className="text-white text-sm">{form.company_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Role</span>
              <span className="text-white text-sm">{form.role || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Interview type</span>
              <span className="text-white text-sm capitalize">{interviewType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Mode</span>
              <span className={`text-sm font-medium capitalize ${mode === 'mock' ? 'text-red-400' : 'text-purple-400'}`}>
                {mode === 'mock' ? '🎯 Mock Interview' : '📚 Practice'}
              </span>
            </div>
            {interviewType === 'behavioral' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Questions</span>
                <span className="text-white text-sm">{form.num_questions}</span>
              </div>
            )}
          </div>

          {/* Resume upload */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Resume <span className="text-slate-600">(optional — PDF, DOCX, or TXT)</span>
            </label>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-white text-sm font-medium">📄 {file.name}</p>
                    <p className="text-slate-500 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-400 text-sm">Click to upload your resume</p>
                    <p className="text-slate-600 text-xs mt-1">PDF, DOCX, or TXT · Max 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-6 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              ← Back
            </button>
            <button
              onClick={handleStart}
              disabled={loading}
              className={`flex-1 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors ${
                mode === 'mock'
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              {loading
                ? '🔍 Researching and generating questions...'
                : interviewType === 'coding'
                ? '💻 Start Coding Interview'
                : mode === 'mock'
                ? `🎯 Start Mock Interview — ${form.num_questions} Questions`
                : `🎤 Start Practice — ${form.num_questions} Questions`
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}