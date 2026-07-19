import axios from 'axios'
import { supabase } from '../lib/supabase'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(async (config) =>{
  const {data: { session } } = await supabase.auth.getSessions()
  if (session?.access_token){
    config.headers.Authorization = 'Bearer ${sessions.access_token'
  }
  return config
})

export const startSession = (data) => api.post('/interview/start', data)
export const submitAnswer = (data) => api.post('/interview/answer', data)
export const getSession = (id) => api.get(`/interview/session/${id}`)
export const completeSession = (id) => api.post(`/interview/session/${id}/complete`)
export const getSessions = () => api.get('/sessions')
export const transcribeAudio = (formData) => api.post('/interview/transcribe', formData, {headers: { 'Content-Type': 'multipart/form-data' }})
export const speakText = (text) => api.post('/interview/speak', { text }, {responseType: 'blob'})
export const getDeepgramKey = () => api.get('/interview/deepgram-key')
export const prefetchSpeak = (text) => api.post('/interview/prefetch-speak',{text})
export const generateProblem = (data) => api.post('/coding/problem', data)
export const executeCode = (data) => api.post('/coding/execute', data)
export const reviewCode = (data) => api.post('/coding/review', data)
export const startCodingSession = (data) => api.post('/coding/session/start', data)
export const getCodingSession = (id) => api.get(`/coding/session/${id}`)
export const getHint = (data) => api.post('/coding/hint', data)
export const getNextDifficulty = (data) => api.post('coding/next-difficulty', data)
export const uploadResume = (formData) => api.post('/interview/upload-resume', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})