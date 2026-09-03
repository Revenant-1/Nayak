const API_BASE_URL = 'http://192.168.1.48:8000'

async function request(path, options = {}) {
  const { token, headers = {}, ...fetchOptions } = options

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
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: requestHeaders,
    })
  } catch (error) {
    throw new Error(
      `Could not reach the Nayak backend. Check that the backend is running and the phone is connected to the same network.`,
    )
  }

  let data = null

  try {
    data = await response.json()
  } catch {
    // Some successful responses may not contain JSON.
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return data
}

export const api = {
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
    return request(`/api/auth/verify?token=${encodeURIComponent(token)}`)
  },

  async createSession(token) {
    return request('/api/session', {
      method: 'POST',
      token,
    })
  },

  async history(sessionId, token) {
    return request(
      `/api/history?session_id=${encodeURIComponent(sessionId)}`,
      {
        token,
      },
    )
  },

  async command({ text, session_id }, token) {
    return request('/api/command', {
      method: 'POST',
      token,
      body: JSON.stringify({
        text,
        session_id: session_id || null,
      }),
    })
  },

  async newChat(token) {
    return request('/api/new-chat', {
      method: 'POST',
      token,
    })
  },
}

export { API_BASE_URL }