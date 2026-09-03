import { storage } from './storage'

/*
 * Development API server.
 *
 * IMPORTANT:
 * Android Expo Go cannot use localhost to reach the computer running
 * FastAPI. Use the computer's LAN IP instead.
 *
 * You can override this with:
 *
 * EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:8000
 *
 * when needed.
 */
const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.48:8000'

function buildUrl(path) {
    return `${API_BASE_URL}${path}`
}

async function parseResponse(response) {
    const text = await response.text()

    if (!text) {
        return null
    }

    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

async function request(path, options = {}) {
    const token = await storage.getItem('auth_token')

    const headers = {
        Accept: 'application/json',
        ...(options.headers || {}),
    }

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`
    }

    if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    let response

    try {
        response = await fetch(buildUrl(path), {
            ...options,
            headers,
        })
    } catch (error) {
        throw new Error(
            `Could not reach the backend at ${API_BASE_URL}. ` +
            `Make sure the FastAPI server is running and the phone is on the same network.`,
        )
    }

    const data = await parseResponse(response)

    if (!response.ok) {
        const message =
            data?.detail ||
            data?.error ||
            data?.message ||
            `Request failed (${response.status})`

        throw new Error(message)
    }

    return data
}

export const api = {
    login: (body) =>
        request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    register: (body) =>
        request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    guestLogin: () =>
        request('/api/auth/guest-login', {
            method: 'POST',
        }),

    verifyToken: async (token) =>
        request('/api/auth/verify', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),

    createSession: () =>
        request('/api/session', {
            method: 'POST',
        }),

    history: (sessionId) =>
        request(
            `/api/history?session_id=${encodeURIComponent(sessionId)}`,
            {
                method: 'GET',
            },
        ),

    command: (body) =>
        request('/api/command', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    newChat: () =>
        request('/api/new-chat', {
            method: 'POST',
        }),
}

export { API_BASE_URL }

