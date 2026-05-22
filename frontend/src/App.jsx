import {useState} from 'react'
import Setup from './components/Setup'
import Interview from './components/Interview'
import History from  './components/History'

export default function App(){
  const [screen, setScreen] = useState('setup')
  const [sessionData, setSessionData] = useState({})

  const handleSessionStart = (data) =>{
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
        <nav className="flex gap-4">
          <button
            onClick={() => setScreen('setup')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              screen === 'setup'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Session
          </button>
          <button
            onClick={() => setScreen('history')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              screen === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {screen === 'setup' && (
          <Setup onSessionStart={handleSessionStart} />
        )}
        {screen === 'interview' && sessionData && (
          <Interview
            sessionData={sessionData}
            onComplete={() => setScreen('history')}
          />
        )}
        {screen === 'history' && (
          <History />
        )}
      </main>
    </div>
  )
}