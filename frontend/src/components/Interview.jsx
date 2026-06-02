import { useState, useEffect, useRef } from 'react'
import { submitAnswer, completeSession, transcribeAudio, speakText, getDeepgramKey } from '../api/client'

export default function Interview({ sessionData, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState([])
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const [timeLeft, setTimeLeft] = useState(sessionData.time_limit || 0)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)
  const [liveTranscript, setLiveTranscript] = useState('')
  const streamIntervalRef = useRef(null)
  const deepgramSocketRef = useRef(null)

  const startTimer = (seconds) => {
    setTimeLeft(seconds)
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1){
          clearInterval(timerRef.current)
          setTimerActive(false)
          return 0
        } 
        return prev - 1
      })
    }, 1000)
  }

const clearTimer = () => {
  if (timerRef.current) {
    clearInterval(timerRef.current)
  }
  setTimeLeft(null)
  setTimerActive(false)
}

  useEffect(() => {
    const raw = sessionData.questions_raw || ''
    const lines = raw.split('\n').filter(l => l.trim())
    const parsed = []
    for (const line of lines) {
      if (/^\d+[\.\)]/.test(line.trim())) {
        const q = line.replace(/^\d+[\.\)]\s*/, '').replace(/\*\*/g, '').trim()
        if (q.length > 20) parsed.push(q)
      }
    }
    setQuestions(parsed.length ? parsed : [raw])
  }, [sessionData])



  const speakQuestion = async (text) => {
    try {
      const res = await speakText(text)
      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      audio.play()
    } catch (err) {
      console.error('Speech failed:', err)
    }
  }

  const startRealtimeTranscription = async () => {
  const keyRes = await getDeepgramKey()
  const apiKey = keyRes.data.key

  const socket = new WebSocket(
    `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true`,
    ['token', apiKey]
  )
  // rest stays the same

  socket.onopen = () => {
    console.log('Deepgram WebSocket connected')
    mediaRecorderRef.current.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(e.data)
      }
    })
  }

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data)
    const transcript = data?.channel?.alternatives?.[0]?.transcript
    const isFinal = data?.is_final

    if (transcript) {
      if (isFinal) {
        setAnswer(prev => prev ? prev + ' ' + transcript : transcript)
        setLiveTranscript('')
      } else {
        setLiveTranscript(transcript)
      }
    }
  }

  socket.onerror = (e) => console.error('Deepgram WS error:', e)
  socket.onclose = () => console.log('Deepgram WS closed')

  return socket
}

  useEffect(() => {
    if (questions.length > 0 && questions[current]) {
      clearTimer()
      speakQuestion(questions[current]).then(() => {
        startTimer(120)
      })
    }
  }, [current, questions])


const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []
    setLiveTranscript('')
    setAnswer('')

    // Get key and open WebSocket
    const keyRes = await getDeepgramKey()
    const apiKey = keyRes.data.key

    const socket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true`,
      ['token', apiKey]
    )
    deepgramSocketRef.current = socket

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const transcript = data?.channel?.alternatives?.[0]?.transcript
      const isFinal = data?.is_final
      if (transcript) {
        if (isFinal) {
          setAnswer(prev => prev ? prev + ' ' + transcript : transcript)
          setLiveTranscript('')
        } else {
          setLiveTranscript(transcript)
        }
      }
    }

    socket.onerror = (e) => console.error('Deepgram WS error:', e)
    socket.onclose = () => console.log('Deepgram WS closed')

    // Wait for socket to open before starting recorder
    await new Promise((resolve, reject) => {
      socket.onopen = () => {
        console.log('✅ Deepgram WebSocket connected')
        resolve()
      }
      setTimeout(() => reject(new Error('WebSocket timeout')), 5000)
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(e.data)
        }
      }
    }

    mediaRecorder.onstop = () => {
      if (deepgramSocketRef.current) {
        deepgramSocketRef.current.close()
      }
      setLiveTranscript('')
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start(250)
    setRecording(true)

  } catch (err) {
    console.error('Recording error:', err)
    alert('Could not start recording: ' + err.message)
  }
}

const stopRecording = () => {
  if (mediaRecorderRef.current && recording) {
    mediaRecorderRef.current.stop()
    setRecording(false)
  }
}

  // const handleTranscribe = async (blob) => {
  //   setTranscribing(true)
  //   try {
  //     const formData = new FormData()
  //     formData.append('audio', blob, 'answer.webm')
  //     const res = await transcribeAudio(formData)
  //     setAnswer(prev => prev ? prev + ' ' + res.data.text : res.data.text)
  //   } catch (err) {
  //     console.error('Transcription failed:', err)
  //     alert('Transcription failed. Try typing your answer instead.')
  //   } finally {
  //     setTranscribing(false)
  //   }
  // }



  const handleSubmit = async () => {
    if (!answer.trim()) return
    clearTimer()
    setLoading(true)
    try {
      const res = await submitAnswer({
        session_id: sessionData.session_id,
        question: questions[current],
        answer: answer,
        company_name: 'the company',
        role: 'the role'
      })
      setFeedback(res.data)
      setScores(prev => [...prev, res.data.score])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    clearTimer()
    if (current + 1 >= questions.length) {
      handleComplete()
    } else {
      setCurrent(prev => prev + 1)
      setAnswer('')
      setFeedback(null)
    }
  }

  const handleComplete = async () => {
    await completeSession(sessionData.session_id)
    onComplete()
  }

  if (!questions.length) return (
    <div className="text-center py-20 text-slate-400">Loading questions...</div>
  )

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <span className={`text-sm font-mono font-bold ${
              timeLeft <= 30
                ? 'text-red-400 animate-pulse'
                : timeLeft <= 60
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}>
              ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          )}
          {avgScore !== null && (
            <span className="text-sm text-purple-400 font-mono">
              Avg: {avgScore}/10
            </span>
          )}
        </div>
      </div>

      <div className="w-full bg-dark-700 rounded-full h-1.5">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">
            Question {current + 1}
          </p>
          <button
            onClick={() => speakQuestion(questions[current])}
            className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
            title="Repeat question"
          >
            🔊 Repeat
          </button>
        </div>
        <p className="text-white text-lg leading-relaxed">
          {questions[current]}
        </p>
      </div>

      {/* Answer */}
      {!feedback && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer or use the mic button to speak..."
              rows={6}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />

            {/* Mic button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                  : transcribing
                  ? 'bg-dark-600 cursor-wait'
                  : 'bg-purple-600 hover:bg-purple-500'
              }`}
              title={recording ? 'Stop recording' : 'Start voice input'}
            >
              {transcribing ? (
                <span className="text-xs text-white">...</span>
              ) : recording ? (
                <span className="text-white text-lg">⏹</span>
              ) : (
                <span className="text-white text-lg">🎤</span>
              )}
            </button>
          </div>

          {recording && (
            <div className="space-y-2">
              <p className="text-red-400 text-sm text-center animate-pulse">
                🔴 Recording... click the button again to stop
              </p>
              {liveTranscript && (
                <div className="bg-dark-600 border border-dark-500 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Live transcript</p>
                  <p className="text-slate-300 text-sm italic">{liveTranscript}</p>
                </div>
              )}
            </div>
          )}

          {transcribing && (
            <p className="text-purple-400 text-sm text-center">
              ⏳ Transcribing your answer...
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-dark-600 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Analyzing your answer...' : 'Submit Answer'}
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="space-y-4">
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-purple-400 font-mono uppercase tracking-wider">
                AI Feedback
              </p>
              <span className="text-2xl font-bold font-mono text-white">
                {feedback.score}
                <span className="text-slate-500 text-lg">/10</span>
              </span>
            </div>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.feedback}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {current + 1 >= questions.length ? 'Complete Session' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}