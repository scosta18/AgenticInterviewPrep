import { useState } from 'react'
import Setup from './components/Setup'
import Interview from './components/Interview'
import History from './components/History'
import Dashboard from './components/Dashboard'
import CodingInterview from './components/CodingInterview'

export default function App() {
  const [screen, setScreen] = useState('setup')
  const [sessionData, setSessionData] = useState(null)

  const handleSessionStart = (data) => {
    setSessionData(data)
    setScreen('interview')
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200">
      {/* Header */}
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
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${
                screen === s
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
        {screen === 'setup' && <Setup onSessionStart={handleSessionStart} />}
        {screen === 'interview' && sessionData && (
          <Interview sessionData={sessionData} onComplete={() => setScreen('dashboard')} />
        )}
        {screen === 'coding' && <CodingInterview />}
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'history' && <History />}
      </main>
    </div>
  )
}