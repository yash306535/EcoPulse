import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Leaf } from "lucide-react";
import { api } from "../lib/api.js";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm EcoBot 🌱 Ask me anything about cutting your carbon footprint." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await api.chat(text);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "I'm offline for a moment — try a small swap like a meat-free meal today!",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-teal text-white shadow-soft flex items-center justify-center hover:bg-forest transition-colors z-50"
        aria-label={open ? "Close EcoBot chat" : "Open EcoBot chat"}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 w-[22rem] max-w-[calc(100vw-3rem)] h-[28rem] bg-surface rounded-2xl shadow-soft flex flex-col overflow-hidden z-50"
          role="dialog"
          aria-label="EcoBot chat"
        >
          <div className="bg-teal text-white px-4 py-3 flex items-center gap-2">
            <Leaf className="h-5 w-5" aria-hidden="true" />
            <span className="font-bold">Ask EcoBot</span>
          </div>
          <div
            className="flex-1 overflow-y-auto p-3 space-y-3"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-teal text-white" : "bg-cream text-charcoal"
                  }`}
                >
                  <span className="sr-only">
                    {m.role === "user" ? "You said:" : "EcoBot said:"}
                  </span>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-sm text-slate px-1">EcoBot is thinking…</div>}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-slate/10 flex gap-2">
            <label htmlFor="ecobot-input" className="sr-only">
              Ask EcoBot a question
            </label>
            <input
              id="ecobot-input"
              className="input py-2"
              placeholder="Ask about cutting emissions…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              className="btn-primary px-3 py-2"
              disabled={busy}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
