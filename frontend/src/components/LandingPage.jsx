export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-dark-900 text-slate-200">

      {/* Nav */}
      <nav className="border-b border-dark-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <span className="font-semibold text-white">Interview Prep AI</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
          <button
            onClick={onGetStarted}
            className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span className="text-xs text-purple-400 font-medium">AI-Powered Interview Coaching</span>
        </div>

        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          Practice interviews.<br />
          <span className="text-purple-400">Get hired faster.</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Your AI coach researches the company, generates targeted questions based on your resume,
          conducts a live voice interview, and gives you brutally honest feedback — all in minutes.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-8 py-3.5 rounded-lg transition-colors text-sm"
          >
            Start Practicing Free →
          </button>
          <a
            href="#how-it-works"
            className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-3.5"
          >
            See how it works
          </a>
        </div>

        {/* Mock interview card */}
        <div className="mt-16 bg-dark-700 border border-dark-600 rounded-2xl p-6 text-left max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <span className="text-purple-400 text-lg">🤖</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">AI Interviewer</p>
              <p className="text-slate-500 text-xs">Google · Senior Software Engineer</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="bg-dark-900 rounded-xl p-4 mb-3">
            <p className="text-slate-300 text-sm leading-relaxed">
              "Tell me about a time you had to make a difficult technical decision under time pressure.
              How did you approach the tradeoffs?"
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-dark-900 rounded-lg px-4 py-2.5 border border-dark-500">
              <p className="text-slate-600 text-xs">🎤 Listening...</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <span className="text-white text-xs">⏹</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-dark-600 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-purple-400 font-mono uppercase tracking-wider text-center mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-white text-center mb-16">From job description to offer-ready in minutes</h2>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "📄",
                title: "Paste the job description",
                desc: "Upload your resume and paste the job posting. The AI researches the company using real data from the web."
              },
              {
                step: "02",
                icon: "🎤",
                title: "Interview with your AI coach",
                desc: "The AI speaks questions aloud. You answer by voice. It adapts to your responses in real time."
              },
              {
                step: "03",
                icon: "📊",
                title: "Get scored feedback",
                desc: "Receive brutally honest scores, detailed feedback, and a downloadable PDF report after every session."
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
                  {item.icon}
                </div>
                <p className="text-xs text-purple-400 font-mono mb-2">{item.step}</p>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-dark-600 py-20 bg-dark-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-purple-400 font-mono uppercase tracking-wider text-center mb-3">Features</p>
          <h2 className="text-3xl font-bold text-white text-center mb-4">Not just another chatbot</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto text-sm">
            Most interview tools give you generic questions. This one researches your specific company,
            reads your resume, and coaches you like a real interviewer would.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🎤", title: "Real-time voice interviews", desc: "Speak your answers out loud. The AI listens, transcribes, and responds — just like a real interview." },
              { icon: "🤖", title: "Agentic research pipeline", desc: "The AI agent researches your target company before every session using real data from the web." },
              { icon: "💻", title: "Coding interview mode", desc: "Monaco editor + AI-generated LeetCode-style problems tailored to your role. Adaptive difficulty." },
              { icon: "📈", title: "Adaptive difficulty", desc: "Score high and the next problem gets harder. Score low and it steps back. The AI decides, not you." },
              { icon: "📄", title: "Resume-aware questions", desc: "Upload your resume and every question is tailored to your actual background and experience." },
              { icon: "📊", title: "Progress dashboard", desc: "Track your scores across sessions. See your trend, your best session, your weak spots." },
              { icon: "🔊", title: "Voice commands", desc: "Say 'hint', 'repeat', or 'submit' during coding rounds. Hands-free interview practice." },
              { icon: "📋", title: "PDF reports", desc: "Download a full session report with every question, your answer, score, and feedback." },
            ].map((f, i) => (
              <div key={i} className="bg-dark-700 border border-dark-600 rounded-xl p-5 flex gap-4">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="text-white font-medium text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview types */}
      <section className="border-t border-dark-600 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-purple-400 font-mono uppercase tracking-wider text-center mb-3">Interview types</p>
          <h2 className="text-3xl font-bold text-white text-center mb-4">For every role, every major</h2>
          <p className="text-slate-400 text-center mb-12 text-sm max-w-xl mx-auto">
            Whether you're applying for a software engineering role or a business analyst position,
            we have a mode for you.
          </p>

          <div className="grid grid-cols-5 gap-3">
            {[
              { icon: "🎤", label: "Behavioral", status: "available" },
              { icon: "💻", label: "Coding", status: "available" },
              { icon: "📦", label: "Case Interview", status: "coming" },
              { icon: "🧩", label: "Product Sense", status: "coming" },
              { icon: "🏗️", label: "System Design", status: "coming" },
            ].map((t, i) => (
              <div key={i} className={`rounded-xl p-4 text-center border ${
                t.status === 'available'
                  ? 'bg-dark-700 border-purple-500/30'
                  : 'bg-dark-800 border-dark-600 opacity-60'
              }`}>
                <span className="text-2xl block mb-2">{t.icon}</span>
                <p className="text-white text-xs font-medium">{t.label}</p>
                {t.status === 'coming' && (
                  <p className="text-slate-600 text-xs mt-1">Coming soon</p>
                )}
                {t.status === 'available' && (
                  <p className="text-purple-400 text-xs mt-1">Available</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dark-600 py-20 bg-dark-800/50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to stop winging it?
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Real interviews are nerve-wracking. Practice until they're not.
            Free to use, no signup required.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-10 py-4 rounded-lg transition-colors"
          >
            Start Practicing Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
              AI
            </div>
            <span className="text-slate-400 text-sm">Interview Prep AI</span>
          </div>
          <p className="text-slate-600 text-xs">
            Built by <a href="https://github.com/scosta18" className="text-slate-400 hover:text-white transition-colors">Sandro Costa</a>
          </p>
        </div>
      </footer>

    </div>
  )
}