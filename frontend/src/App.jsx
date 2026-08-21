import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { User, LogOut, Moon, Sun, Menu } from "lucide-react";

import Sidebar from "./components/Sidebar.jsx";
import ChatView from "./components/ChatView.jsx";
import InputBar from "./components/InputBar.jsx";
import VoiceInput from "./components/voiceinput.jsx";
import Profile from "./components/Profile.jsx";
import Login from "./components/Login.jsx";
import { useNayak } from "./hooks/useNayak.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("auth_token"))
  );

  const [messages, setMessages] = useState([]);
  const [backendOnline, setBackendOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [focusIndex, setFocusIndex] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

  useLayoutEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const appendExchange = useCallback(({ userText, assistantText }) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText, time: nowLabel() },
      { role: "assistant", content: assistantText, time: nowLabel() },
    ]);
  }, []);

  const addUserMessage = useCallback((userText) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText, time: nowLabel() },
    ]);
  }, []);

  const {
    status,
    micOn,
    micSupported,
    interimText,
    error,
    toggleMic,
    sendTextCommand,
  } = useNayak({
    onExchange: appendExchange,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadHistory() {
      try {
        const token = localStorage.getItem("auth_token");

        const res = await fetch(`${API_BASE}/api/history`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error(`status ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.history ?? [];

        if (!cancelled) {
          setMessages(list);
          setBackendOnline(true);
        }
      } catch (err) {
        console.warn("[App] could not load chat history:", err.message);
        if (!cancelled) setBackendOnline(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) setBackendOnline(false);
  }, [error]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setMessages([]);
  };

  const handleNewChat = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");

      await fetch(`${API_BASE}/api/new-chat`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { }

    setMessages([]);
    setFocusIndex(null);
  }, []);

  const handleSelectEntry = useCallback((index) => {
    setFocusIndex(index);
  }, []);

  const stateLabel = {
    sleeping: "Idle",
    listening: "Listening",
    processing: "Processing",
  }[status];

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden text-ink">
      <Sidebar
        history={messages}
        status={status}
        onNewChat={handleNewChat}
        activeIndex={focusIndex}
        onSelectEntry={handleSelectEntry}
        backendOnline={backendOnline}
      />

      {showProfile && (
        <Profile
          onClose={() => setShowProfile(false)}
          darkMode={darkMode}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 backdrop-blur-xl"
          style={{
            background: "rgb(var(--panel) / 0.80)",
            borderBottom: "1px solid rgb(var(--line))",
          }}
        >
          <div>
            <h1
              className="font-display text-xl font-bold"
              style={{ color: "rgb(var(--ink))" }}
            >
              Legal Assistant Session
            </h1>

            <p
              className="mt-1 font-mono text-xs"
              style={{ color: "rgb(var(--mist))" }}
            >
              {loading ? "Syncing chat history..." : `${messages.length} messages`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg transition duration-200 hover:scale-105 active:scale-95"
                title="Menu"
              >
                <Menu size={20} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-14 z-50 w-56 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
                  style={{
                    background: "rgb(var(--panel) / 0.92)",
                    border: "1px solid rgb(var(--line))",
                    color: "rgb(var(--ink))",
                  }}
                >
                  {/* Profile */}
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setMenuOpen(false);
                    }}
                    className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                  >
                    <User size={18} className="text-emerald-500" />
                    <span>My Profile</span>
                  </button>

                  {/* Theme */}
                  <button
                    onClick={() => {
                      setDarkMode((prev) => !prev);
                      setMenuOpen(false);
                    }}
                    className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                  >
                    {darkMode ? (
                      <Sun size={18} className="text-yellow-500" />
                    ) : (
                      <Moon size={18} className="text-indigo-500" />
                    )}
                    <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-500 transition hover:bg-red-500/10"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* State */}
            <span className="status-pill rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest">
              State: {stateLabel}
            </span>
          </div>
        </header>

        {/* Backend Warning */}
        {!backendOnline && (
          <div className="border-b border-red-400/20 bg-red-400/10 px-6 py-2 text-center font-mono text-xs text-red-500">
            Can't reach the backend. Start the Nayak FastAPI server with{" "}
            <code>uv run uvicorn app.api_server:app --reload</code>.
          </div>
        )}

        {/* Voice Orb */}
        <div className="flex shrink-0 items-center justify-center pb-2 pt-6">
          <VoiceInput
            status={status}
            sendTextCommand={sendTextCommand}
            addUserMessage={addUserMessage}
          />
        </div>

        {/* Chat */}
        <ChatView
          messages={messages}
          focusIndex={focusIndex}
          interimText={interimText}
        />

        {/* Input */}
        <InputBar
          onSend={sendTextCommand}
          micActive={micOn}
          onToggleMic={toggleMic}
          micSupported={micSupported}
          disabled={status === "processing"}
        />
      </main>
    </div>
  );
}