import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { generateProblem, reviewCode, speakText, startCodingSession } from '../api/client'

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
    if (lang === 'python') {
      return `${signature}\n    pass\n`
    }
    if (lang === 'javascript' || lang === 'java' || lang === 'cpp') {
      return `${signature.replace(/\{\s*\}/, '{\n    \n}')}\n`
    }
    return `${signature}\n`
  }
  return STARTERS[lang]
}

export default function CodingInterview() {
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [language, setLanguage] = useState('python')
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState(STARTERS.python)
  const [reviewing, setReviewing] = useState(false)
  const [review, setReview] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState(null)

  // Speak problem when it loads
  useEffect(() => {
    if (problem?.description) {
      speakText(`Here is your coding problem: ${problem.title}. ${problem.description}`)
        .then(res => {
          const url = URL.createObjectURL(res.data)
          new Audio(url).play()
        })
        .catch(console.error)
    }
  }, [problem])

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
    if (!problem) return
    setReviewing(true)
    setReview(null)
    try {
      const res = await reviewCode({
      session_id: sessionId,
      problem_title: problem.title,
      problem_description: problem.description,
      difficulty: problem.difficulty,
      code,
      language,
    })
      setReview(res.data)
    } catch (err) {
      setError('Review failed.')
      console.error(err)
    } finally {
      setReviewing(false)
    }
  }

  const handleReset = () => {
  setProblem(null)
  setReview(null)
  setSessionId(null)
  setCode(STARTERS[language])
  setError('')
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Coding Interview</h1>
        <p className="text-slate-400 mt-1 text-sm">
          AI generates a role-targeted problem — write your solution and get scored feedback on your thinking.
        </p>
      </div>

      {/* Config */}
      {!problem && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Your Role</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Backend Engineer, Data Scientist"
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      difficulty === d
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-dark-900 border-dark-600 text-slate-400 hover:border-dark-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Language</label>
              <div className="flex gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === l
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-dark-900 border-dark-600 text-slate-400 hover:border-dark-500'
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
            {generating ? '⚙️ Generating problem...' : 'Generate Problem'}
          </button>
        </div>
      )}

      {/* Problem */}
      {problem && (
        <div className="space-y-4">
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg">{problem.title}</h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded mt-1 inline-block ${
                  problem.difficulty === 'easy' ? 'text-green-400 bg-green-400/10' :
                  problem.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-400/10' :
                  'text-red-400 bg-red-400/10'
                }`}>
                  {problem.difficulty}
                </span>
              </div>
              <button
                onClick={() => speakText(`${problem.title}. ${problem.description}`)
                  .then(res => new Audio(URL.createObjectURL(res.data)).play())
                  .catch(console.error)
                }
                className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
              >
                🔊 Repeat
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">{problem.description}</p>

            {problem.examples?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Examples</p>
                {problem.examples.map((ex, i) => (
                  <div key={i} className="bg-dark-900 rounded-lg p-3 font-mono text-xs space-y-1">
                    <p className="text-slate-400">Input: <span className="text-white">{JSON.stringify(ex.input)}</span></p>
                    <p className="text-slate-400">Output: <span className="text-white">{JSON.stringify(ex.output)}</span></p>
                    {ex.explanation && <p className="text-slate-500">{ex.explanation}</p>}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints?.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Constraints</p>
                <ul className="space-y-1">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="text-slate-400 text-xs font-mono">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="flex gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  language === l
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-dark-700 border-dark-600 text-slate-400 hover:border-dark-500'
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
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={val => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                tabSize: 4,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReview}
              disabled={reviewing}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {reviewing ? '⏳ Reviewing...' : '🧠 Submit for Review'}
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
            <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">AI Review</p>
                <span className="text-2xl font-bold font-mono text-white">
                  {review.score}<span className="text-slate-500 text-lg">/10</span>
                </span>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {review.feedback}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}