import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [accountType, setAccountType] = useState('candidate')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (mode === 'signup' && !fullName) {
      setError('Please enter your full name.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: accountType,
          }
        }
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            AI
          </div>
          <h1 className="text-2xl font-bold text-white">Interview Prep AI</h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-dark-700 border border-dark-600 rounded-2xl p-6 space-y-4">

          {/* Account type — signup only */}
          {mode === 'signup' && (
            <div>
              <label className="text-sm text-slate-400 block mb-2">I am a</label>
              <div className="flex gap-3">
                {[
                  { id: 'candidate', label: 'Candidate', icon: '🎯', desc: 'Preparing for interviews' },
                  { id: 'recruiter', label: 'Recruiter', icon: '🏢', desc: 'Assessing candidates' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setAccountType(t.id)}
                    className={`flex-1 p-3 rounded-xl border text-left transition-colors ${
                      accountType === t.id
                        ? 'bg-purple-600/10 border-purple-500'
                        : 'bg-dark-900 border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-lg block mb-1">{t.icon}</span>
                    <p className="text-white text-sm font-medium">{t.label}</p>
                    <p className="text-slate-500 text-xs">{t.desc}</p>
                  </button>
                ))}
              </div>
              {accountType === 'recruiter' && (
                <p className="text-yellow-400 text-xs mt-2">
                  ⚠️ Recruiter accounts require manual approval before activation.
                </p>
              )}
            </div>
          )}

          {/* Full name — signup only */}
          {mode === 'signup' && (
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Full Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          {/* Submit */}
          <button
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-dark-900 hover:bg-dark-800 border border-dark-600 hover:border-dark-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Toggle mode */}
        <p className="text-center text-slate-400 text-sm">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  )
}