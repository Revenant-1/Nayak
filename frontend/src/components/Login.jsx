import { useState } from "react";

import {
  Lock,
  Mail,
  User,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        // -----------------------------
        // REGISTER
        // -----------------------------
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Registration failed");
        }

        // Automatically log in after registration
        const userObj = {
          user_id: data.user_id,
          username: data.username,
          user_type: data.user_type,
          email,
        };

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("nayak_user", JSON.stringify(userObj));

        onLoginSuccess(userObj);
      } else {
        // -----------------------------
        // LOGIN
        // -----------------------------
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Invalid username or password");
        }

        const userObj = {
          user_id: data.user_id,
          username: data.username,
          user_type: data.user_type,
        };

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("nayak_user", JSON.stringify(userObj));

        onLoginSuccess(userObj);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/guest-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Guest login failed");
      }

      const guestUser = {
        user_id: data.user_id,
        username: data.username,
        user_type: data.user_type || "guest",
        isGuest: true,
      };

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("nayak_user", JSON.stringify(guestUser));

      onLoginSuccess(guestUser);
    } catch (err) {
      setError(err?.message || "Guest login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 font-sans text-[rgb(var(--ink))]">
      {/* LOGIN CARD */}
      <div className="glass w-full max-w-md rounded-2xl p-8">
        {/* HEADER */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-[rgb(var(--iris))]">
            <Lock size={22} />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--ink))]">
            {isRegister ? "Create an Account" : "Welcome to Nayak"}
          </h2>

          <p className="mt-1 text-sm text-[rgb(var(--mist))]">
            {isRegister
              ? "Register to start your legal assistant session"
              : "Sign in to access your legal assistant session"}
          </p>
        </div>

        {/* MODE SWITCH */}
        <div className="mb-6 flex rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] p-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              !isRegister
                ? "bg-[rgb(var(--iris))] text-white shadow-sm"
                : "text-[rgb(var(--mist))] hover:text-[rgb(var(--ink))]"
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              isRegister
                ? "bg-[rgb(var(--iris))] text-white shadow-sm"
                : "text-[rgb(var(--mist))] hover:text-[rgb(var(--ink))]"
            }`}
          >
            Register
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-500">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USERNAME */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--mist))]">
              Username
            </label>

            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--mist))]"
                size={16}
              />

              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="h-11 w-full rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] py-2.5 pl-10 pr-3 text-sm text-[rgb(var(--ink))] outline-none transition placeholder:text-[rgb(var(--mist))]/50 focus:border-[rgb(var(--iris))] focus:ring-1 focus:ring-[rgb(var(--iris))]"
              />
            </div>
          </div>

          {/* EMAIL — REGISTER ONLY */}
          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--mist))]">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--mist))]"
                  size={16}
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 w-full rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] py-2.5 pl-10 pr-3 text-sm text-[rgb(var(--ink))] outline-none transition placeholder:text-[rgb(var(--mist))]/50 focus:border-[rgb(var(--iris))] focus:ring-1 focus:ring-[rgb(var(--iris))]"
                />
              </div>
            </div>
          )}

          {/* PASSWORD */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--mist))]">
              Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--mist))]"
                size={16}
              />

              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] py-2.5 pl-10 pr-10 text-sm text-[rgb(var(--ink))] outline-none transition placeholder:text-[rgb(var(--mist))]/50 focus:border-[rgb(var(--iris))] focus:ring-1 focus:ring-[rgb(var(--iris))]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--mist))] transition hover:text-[rgb(var(--ink))] focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`gradient-btn mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
              loading
                ? "cursor-not-allowed opacity-60"
                : "hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {isRegister ? "Creating Account..." : "Signing In..."}
                </span>
              </>
            ) : (
              <>
                <span>
                  {isRegister ? "Register & Enter" : "Sign In"}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgb(var(--line))]" />
          </div>

          <span className="relative bg-[rgb(var(--panel))] px-3 font-mono text-[11px] uppercase tracking-wider text-[rgb(var(--mist))]">
            or
          </span>
        </div>

        {/* GUEST LOGIN */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[rgb(var(--line))] bg-[rgb(var(--panel-hi))] text-sm font-medium text-[rgb(var(--mist))] transition hover:border-[rgb(var(--iris))]/40 hover:bg-[rgb(var(--panel))] hover:text-[rgb(var(--ink))] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserCheck size={16} />
          )}

          <span>Continue as Guest</span>
        </button>

        {/* FOOTER */}
        <p className="mt-5 text-center text-[11px] text-[rgb(var(--mist))]">
          Your session is securely managed by Nayak.
        </p>
      </div>
    </div>
  );
}