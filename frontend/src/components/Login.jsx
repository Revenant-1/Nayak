import { useState } from 'react'
import { Lock, Mail, User, ArrowRight, UserCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { api } from '../lib/api.js'

export default function Login({ onLoginSuccess }) {
    const [isRegister, setIsRegister] = useState(false)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data = isRegister
                ? await api.register({ username, email, password })
                : await api.login({ username, password })
            const userObj = {
                user_id: data.user_id,
                username: data.username,
                user_type: data.user_type,
                ...(isRegister ? { email } : {}),
            }
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('nayak_user', JSON.stringify(userObj))
            await onLoginSuccess(userObj)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGuestLogin = async () => {
        setLoading(true)
        setError('')

        try {
            const data = await api.guestLogin()

            const guestUser = {
                user_id: data.user_id,
                username: data.username,
                user_type: data.user_type || 'guest',
                isGuest: true,
            }

            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('nayak_user', JSON.stringify(guestUser))
            await onLoginSuccess(guestUser)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
                        onClick={() => {
                            setIsRegister(false)
                            setError('')
                        }}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${!isRegister ? 'bg-violet-600 text-white shadow-sm' : 'text-mist hover:text-ink'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(true)
                            setError('')
                        }}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${isRegister ? 'bg-violet-600 text-white shadow-sm' : 'text-mist hover:text-ink'
                            }`}
                    >
                        Register
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-mist">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="username"
                                className="w-full rounded-lg border border-line bg-[#17163A]/40 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {isRegister && (
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
                    )}

                    <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-mist">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-line bg-[#17163A]/40 py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist transition hover:text-ink focus:outline-none"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <span>{isRegister ? 'Register & Enter' : 'Sign In'}</span>
                                <ArrowRight size={16} />
                            </>
                        )}
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
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-[#17163A]/30 py-2.5 text-sm font-medium text-mist transition hover:border-violet-500/40 hover:bg-[#17163A]/70 hover:text-ink disabled:opacity-50"
                >
                    <UserCheck size={16} />
                    <span>Continue as Guest</span>
                </button>
            </div>
        </div>
    )
}