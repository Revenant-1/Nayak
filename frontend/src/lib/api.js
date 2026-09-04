const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function request(path, options = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.detail || `Request failed (${response.status})`)
  }
  return data
}

export const api = {
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  guestLogin: () => request('/api/auth/guest-login', { method: 'POST' }),
  verifyToken: (token) =>
    request('/api/auth/verify', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),
  createSession: () => request('/api/session', { method: 'POST' }),
  newChat: () => request('/api/new-chat', { method: 'POST' }),
  history: (sessionId) => request(`/api/history?session_id=${encodeURIComponent(sessionId)}`),
  command: (body) => request('/api/command', { method: 'POST', body: JSON.stringify(body) }),
  transcribe: (audio) => {
    const body = new FormData()
    const extension = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'mp4' : 'webm'
    body.append('audio', audio, `recording.${extension}`)
    return request('/api/transcribe', { method: 'POST', body })
  },
}
