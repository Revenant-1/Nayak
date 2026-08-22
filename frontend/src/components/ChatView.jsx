import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * ChatView
 * --------
 * Renders the full transcript (chat_history.json + anything appended this
 * session). Auto-scrolls to the newest message unless the parent has
 * asked us to focus a specific historical entry.
 */
export default function ChatView({ messages, focusIndex, interimText }) {
  const bottomRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    if (focusIndex != null && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, focusIndex, interimText]);

  if (messages.length === 0 && !interimText) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p
            className="font-display text-lg font-semibold"
            style={{ color: "rgb(var(--ink))" }}
          >
            Say “Nayak” or ask a legal question
          </p>

          <p
            className="mt-2 text-sm"
            style={{ color: "rgb(var(--mist))" }}
          >
            Type your query below or tap the microphone — the orb will pulse
            while Nayak listens and processes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-6 py-6">
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            ref={(el) => (itemRefs.current[i] = el)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${m.role === "user"
                  ? "user-bubble rounded-br-sm"
                  : "assistant-bubble rounded-bl-sm"
                }`}
            >
              <div
                className="text-sm leading-relaxed"
                style={{
                  color:
                    m.role === "user"
                      ? "#ffffff"
                      : "rgb(var(--ink))",
                }}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="whitespace-pre-wrap mb-3">{children}</p>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>

              <p
                className="mt-2 font-mono text-[10px]"
                style={{
                  color:
                    m.role === "user"
                      ? "rgba(255,255,255,.75)"
                      : "rgb(var(--mist))",
                }}
              >
                {m.role === "user" ? "you" : "nayak"} ·{" "}
                {m.time || timestamp()}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Live speech preview */}
      {interimText && (
        <div className="flex justify-end">
          <div
            className="max-w-[70%] rounded-2xl rounded-br-sm px-4 py-3 text-sm italic"
            style={{
              background: "rgb(var(--panel-hi))",
              border: "1px dashed rgb(var(--iris))",
              color: "rgb(var(--mist))",
            }}
          >
            {interimText}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}