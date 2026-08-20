import { useState } from 'react'
import { Lock, Mail, User, ArrowRight, UserCheck } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
    const [isRegister, setIsRegister] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isRegister) {
                // Register route
                const res = await fetch(`${API_BASE}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.detail || 'Registration failed')
                }
                setIsRegister(false) // Switch to sign-in tab after successful registration
            } else {
                // Login route (FastAPI standard OAuth2 form payload)
                const formData = new URLSearchParams()
                formData.append('username', email)
                formData.append('password', password)

                const res = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString(),
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || 'Invalid email or password')

                localStorage.setItem('auth_token', data.access_token)
                localStorage.setItem('nayak_user', JSON.stringify(data.user))
                onLoginSuccess(data.user)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGuestLogin = () => {
        const guestUser = {
            name: 'Guest User',
            email: 'guest@nayak.local',
            isGuest: true,
        }

        localStorage.setItem('auth_token', 'guest_session_token')
        localStorage.setItem('nayak_user', JSON.stringify(guestUser))
        onLoginSuccess(guestUser)
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-void px-4 font-body text-ink">
            <div className="w-full max-w-md rounded-2xl border border-line bg-[#0d0d1e] p-8 shadow-2xl backdrop-blur-md">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/10 text-violet-400">
                        <Lock size={22} />
                    </div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                        {isRegister ? 'Create an Account' : 'Welcome to Nayak'}
                    </h2>
                    <p className="mt-1 text-sm text-mist">
                        {isRegister
                            ? 'Register to start your legal assistant session'
                            : 'Sign in to access your legal assistant session'}
                    </p>
                </div>

                {/* Mode Switch Tabs */}
                <div className="mb-6 flex rounded-lg border border-line bg-[#17163A]/40 p-1">
                    <button
                        type="button"
                        onClick={() => setIsRegister(false)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${!isRegister ? 'bg-violet-600 text-white shadow-sm' : 'text-mist hover:text-ink'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsRegister(true)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${isRegister ? 'bg-violet-600 text-white shadow-sm' : 'text-mist hover:text-ink'
                            }`}
                    >
                        Register
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-mist">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Alex Morgan"
                                    className="w-full rounded-lg border border-line bg-[#17163A]/40 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-mist">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full rounded-lg border border-line bg-[#17163A]/40 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-mist">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-line bg-[#17163A]/40 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
                    >
                        <span>{isRegister ? 'Register & Enter' : 'Sign In'}</span>
                        <ArrowRight size={16} />
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-line" />
                    </div>
                    <span className="relative bg-[#0d0d1e] px-3 font-mono text-[11px] uppercase tracking-wider text-mist">
                        or
                    </span>
                </div>

                {/* Guest Mode */}
                <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-[#17163A]/30 py-2.5 text-sm font-medium text-mist transition hover:border-violet-500/40 hover:bg-[#17163A]/70 hover:text-ink"
                >
                    <UserCheck size={16} />
                    <span>Continue as Guest</span>
                </button>
            </div>
        </div>
    )
}