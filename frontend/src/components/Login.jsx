import { useState } from 'react'
import { Lock, Mail, User, ArrowRight, UserCheck, AlertCircle, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { api } from '../lib/api.js'

export default function Login({ onLoginSuccess, onAuthStatusChange }) {
    const [isRegister, setIsRegister] = useState(false)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [error, setError] = useState('')
    const [retryCount, setRetryCount] = useState(0)

    const MAX_RETRIES = 1

    const runAuthFlow = async (label, authState, action, isGuest = false) => {
        setError('')
        setStatusText(label)
        onAuthStatusChange?.(authState)
        setLoading(true)

        try {
            const data = await action()
            const userObj = {
                user_id: data.user_id,
                username: data.username,
                user_type: data.user_type,
                ...(isGuest ? {} : isRegister ? { email } : {}),
                isGuest,
            }
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('nayak_user', JSON.stringify(userObj))
            onAuthStatusChange?.('authenticated')
            await onLoginSuccess(userObj)
        } catch (err) {
            const isNetwork = err?.message?.includes('fetch') || err?.message?.includes('Network')
            const message = isNetwork
                ? 'Could not reach the backend. Check the API server.'
                : `Authentication failed: ${err.message}`
            setError(message)
            onAuthStatusChange?.('auth-error', message)
        } finally {
            setLoading(false)
            setStatusText('')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return
        await runAuthFlow(
            isRegister ? 'Creating your account…' : 'Signing you in…',
            isRegister ? 'registering' : 'signing-in',
            () => (isRegister ? api.register({ username, email, password }) : api.login({ username, password })),
        )
    }

    const handleRetry = async () => {
        if (loading) return
        setRetryCount((prev) => prev + 1)
        await runAuthFlow(
            isRegister ? 'Creating your account…' : 'Signing you in…',
            isRegister ? 'registering' : 'signing-in',
            () => (isRegister ? api.register({ username, email, password }) : api.login({ username, password })),
        )
    }

    const handleGuestLogin = async () => {
        if (loading) return
        await runAuthFlow('Launching guest access…', 'guest-login', () => api.guestLogin(), true)
    }

    return (
        <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-void px-4 font-body text-ink">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
                <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
                <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/10" />
            </div>
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-line bg-panel/90 p-8 shadow-[0_25px_80px_rgba(15,80,70,.14)] backdrop-blur-2xl dark:shadow-[0_25px_80px_rgba(0,0,0,.45)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 text-cyan-600 shadow-lg shadow-teal-500/10 dark:text-cyan-300">
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
                <div className="mb-6 flex rounded-lg border border-line bg-panel-hi/70 p-1">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(false)
                            setError('')
                        }}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${!isRegister ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 text-white shadow-md shadow-teal-500/20' : 'text-mist hover:bg-cyan-500/5 hover:text-ink'
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
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${isRegister ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 text-white shadow-md shadow-teal-500/20' : 'text-mist hover:bg-cyan-500/5 hover:text-ink'
                            }`}
                    >
                        Register
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                        {retryCount < MAX_RETRIES && (
                            <button
                                type="button"
                                onClick={handleRetry}
                                disabled={loading}
                                className="ml-2 rounded-md border border-red-500/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                title="Retry authentication"
                            >
                                <RefreshCw size={12} className="inline" /> Retry
                            </button>
                        )}
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
                                className="w-full rounded-lg border border-line bg-panel-hi/70 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
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
                                    className="w-full rounded-lg border border-line bg-panel-hi/70 py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
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
                                className="w-full rounded-lg border border-line bg-panel-hi/70 py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-mist/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
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
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/15 transition hover:from-emerald-500 hover:via-teal-400 hover:to-sky-500 hover:shadow-xl hover:shadow-sky-500/15 disabled:opacity-50"
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
                    {statusText && (
                        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.2em] text-mist">{statusText}</p>
                    )}
                </form>

                {/* Divider */}
                <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-line" />
                    </div>
                    <span className="relative bg-panel px-3 font-mono text-[11px] uppercase tracking-wider text-mist">
                        or
                    </span>
                </div>

                {/* Guest Mode */}
                <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-panel-hi/50 py-2.5 text-sm font-medium text-mist transition hover:border-cyan-500/35 hover:bg-cyan-500/10 hover:text-ink disabled:opacity-50"
                >
                    <UserCheck size={16} />
                    <span>Continue as Guest</span>
                </button>
            </div>
        </div>
    )
}