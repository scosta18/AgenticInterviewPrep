import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const startSession = (data) => api.post('/interview/start', data)
export const submitAnswer = (data) => api.post('/interview/answer', data)
export const getSession = (id) => api.get(`/interview/session/${id}`)
export const completeSession = (id) => api.post(`/interview/session/${id}/complete`)
export const getSessions = () => api.get('/sessions')