import { useState } from 'react'
import Setup from './components/Setup'
import Interview from './components/Interview'
import History from './components/History'
import Dashboard from './components/Dashboard'
import CodingInterview from './components/CodingInterview'
import LandingPage from './components/LandingPage'
import Onboarding from './components/Onboarding'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [sessionData, setSessionData] = useState(null)

  // const handleSessionStart = (data) => {
  //   setSessionData(data)
  //   setScreen('interview')
  // }
    const handleSessionStart = (data) => {
    if (data.type === 'coding') {
      setScreen('coding')
      return
    }
    setSessionData(data)
    setScreen('interview')
  }

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
          {screen === 'setup' && <Onboarding onSessionStart={handleSessionStart} />}
          <main className="max-w-4xl mx-auto px-6 py-8">
            {screen === 'setup' && <Setup onSessionStart={handleSessionStart} />}
            {screen === 'interview' && sessionData && (
              <Interview sessionData={sessionData} onComplete={() => setScreen('dashboard')} />
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