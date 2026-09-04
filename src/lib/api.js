import storage from './storage'

const API_BASE_URL = 'http://192.168.1.48:8000'

async function getAuthToken() {
  return storage.getItem('auth_token')
}

async function request(path, options = {}) {
  const {
    token: suppliedToken,
    headers = {},
    ...fetchOptions
  } = options

  const token =
    suppliedToken ?? (await getAuthToken())

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (fetchOptions.body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  let response

  try {
    console.log(
      `[Nayak API] ${fetchOptions.method || 'GET'} ${API_BASE_URL}${path}`,
    )

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: requestHeaders,
    })
  } catch (error) {
    console.error('[Nayak API] Network error:', error)

    throw new Error(
      'Could not reach the Nayak backend. Check that the backend is running and the phone is connected to the same network.',
    )
  }

  let data = null

  try {
    data = await response.json()
  } catch {
    // Response did not contain JSON.
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      `Request failed with status ${response.status}`

    console.error(
      `[Nayak API] ${response.status} ${path}:`,
      message,
    )

    throw new Error(message)
  }

  console.log(
    `[Nayak API] ${response.status} ${path}`,
    data,
  )

  return data
}

export const api = {
  // -------------------------
  // Authentication
  // -------------------------

  async login({ username, password }) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    })
  },

  async register({ username, email, password }) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        email,
      }),
    })
  },

  async guestLogin() {
    return request('/api/auth/guest-login', {
      method: 'POST',
    })
  },

  async verifyToken(token) {
    return request(
      `/api/auth/verify?token=${encodeURIComponent(token)}`,
    )
  },

  // -------------------------
  // Sessions
  // -------------------------

  async createSession(token) {
    return request('/api/session', {
      method: 'POST',
      token,
    })
  },

  async newChat(token) {
    return request('/api/new-chat', {
      method: 'POST',
      token,
    })
  },

  // -------------------------
  // Chat history
  // -------------------------

  async history(sessionId, token) {
    if (!sessionId) {
      throw new Error('A session ID is required to load chat history.')
    }

    return request(
      `/api/history?session_id=${encodeURIComponent(sessionId)}`,
      {
        token,
      },
    )
  },

  // -------------------------
  // Command
  // -------------------------

  async command({ text, session_id }, token) {
    const trimmed = text?.trim()

    if (!trimmed) {
      throw new Error('Message cannot be empty.')
    }

    return request('/api/command', {
      method: 'POST',
      token,
      body: JSON.stringify({
        text: trimmed,
        session_id: session_id || null,
      }),
    })
  },
}

export { API_BASE_URL }