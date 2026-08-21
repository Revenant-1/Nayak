import {
  Plus,
  Moon,
  MessageSquare,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function Sidebar({
  history = [],
  status = "sleeping",
  onNewChat,
  activeIndex,
  onSelectEntry,
  backendOnline,
}) {
  const statusLabel = {
    sleeping: "SLEEPING",
    listening: "LISTENING",
    processing: "PROCESSING",
  }[status] || "SLEEPING";

  return (
    <aside className="sidebar-shell flex h-screen w-72 flex-col rounded-r-3xl">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_15px_#8b5cf6]" />
          <div>
            <h1 className="text-3xl font-black tracking-wide sidebar-text">
              NAYAK
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] sidebar-muted">
              Legal Assistant
            </p>
          </div>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-5">
        <button
          onClick={onNewChat}
          className="gradient-btn flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold transition hover:scale-[1.02]"
        >
          <Plus size={20} />
          New chat
        </button>
      </div>

      {/* Status */}
      <div className="px-5 pt-4">
        <div className="sidebar-card flex items-center justify-between rounded-2xl px-4 py-3">
          <span className="flex items-center gap-2 font-semibold sidebar-text">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            {statusLabel}
          </span>

        </div>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 pt-6">
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[0.25em] sidebar-muted">
          History
        </p>

        {history.length ? (
          <div className="space-y-3">
            {history
              .filter((msg) => msg.role === "user")
              .map((msg, index) => (
                <button
                  key={index}
                  onClick={() => onSelectEntry(index)}
                  className={`sidebar-card w-full rounded-xl px-4 py-3 text-left transition hover:scale-[1.02] ${
                    activeIndex === index
                      ? "ring-2 ring-violet-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare
                      size={16}
                      className="mt-1 text-violet-500"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm sidebar-text">
                        {msg.content}
                      </p>
                      <p className="mt-1 text-xs sidebar-muted">
                        {msg.time}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        ) : (
          <div className="px-2 pt-4">
            <p className="sidebar-muted text-sm leading-6">
              No conversations yet. Say <strong>"Nayak"</strong> or ask a
              legal query to begin.
            </p>
          </div>
        )}
      </div>

      {/* Backend Status */}
      <div className="px-4 pb-4">
        <div className="sidebar-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendOnline ? "bg-emerald-400" : "bg-red-400"
                }`}
              />

              <span className="font-semibold sidebar-text">
                {backendOnline ? "Backend Online" : "Backend Offline"}
              </span>
            </div>

            {backendOnline ? (
              <Wifi size={18} className="text-emerald-400" />
            ) : (
              <WifiOff size={18} className="text-red-400" />
            )}
          </div>

          <p className="mt-1 text-sm sidebar-muted">
            {backendOnline
              ? "All systems operational"
              : "Connection unavailable"}
          </p>
        </div>
      </div>
    </aside>
  );
}