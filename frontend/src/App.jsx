// import Setup from './components/Setup'
import { useState, useEffect } from 'react'
import Interview from './components/Interview'
import History from './components/History'
import Dashboard from './components/Dashboard'
import CodingInterview from './components/CodingInterview'
import LandingPage from './components/LandingPage'
import Onboarding from './components/Onboarding'
import Results from './components/Results'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [sessionData, setSessionData] = useState(null)
  const [completedSessionId, setCompletedSessionId] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // const handleSessionStart = (data) => {
  //   setSessionData(data)
  //   setScreen('interview')
  // }
  useEffect(() => {
  // Check current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
    setAuthLoading(false)
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [])
  const handleSessionStart = (data) => {
    if (data.type === 'coding') {
      setScreen('coding')
      return
    }
    setSessionData(data)
    setScreen('interview')
  }

  const handleSessionComplete = (sessionId) => {
    setCompletedSessionId(sessionId)
    setScreen('results')
  }

if (authLoading) return (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <p className="text-slate-400">Loading...</p>
  </div>
)

if (!user) return <Auth />
  return (
    <div className="min-h-screen bg-dark-900 text-slate-200">

      {screen === 'landing' && <LandingPage onGetStarted={() => setScreen('setup')} />}

      {screen !== 'landing' && (
        <>
          <header className="border-b border-dark-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <span className="font-semibold text-white">Interview Prep AI</span>
            </div>
            <nav className="flex gap-2">
              {['setup', 'coding', 'dashboard', 'history'].map(s => (
                <button
                  key={s}
                  onClick={() => setScreen(s)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${screen === s
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {s === 'setup' ? 'New Session' : s}
                </button>
              ))}
            </nav>
          </header>
          <main className="max-w-4xl mx-auto px-6 py-8">
            {screen === 'setup' && <Onboarding onSessionStart={handleSessionStart} />}
            {screen === 'interview' && sessionData && (
              <Interview
                sessionData={sessionData}
                mode={sessionData.mode || 'practice'}
                interview_type={sessionData.interview_type || 'behavioral'}
                onComplete={handleSessionComplete}
              />
            )}
            {screen === 'results' && completedSessionId && (
              <Results sessionId={completedSessionId} onPracticeAgain={() => setScreen('setup')} onDashboard={() => setScreen('dashboard')} />
            )}
            {screen === 'dashboard' && <Dashboard />}
            {screen === 'history' && <History />}
            {screen === 'coding' && <CodingInterview />}
          </main>
        </>
      )}
    </div>
  )
}