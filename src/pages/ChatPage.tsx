import { useState, useRef, useEffect } from "react";
import { api } from "../api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await api.post<{ answer: string }>("/api/ai/chat", {
        message: text,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer },
      ]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Request failed";
      setError(String(msg || "Failed to get response"));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-[92rem] flex-col gap-5">
      <header className="glass-panel panel-elevated panel-pad">
        <p className="section-eyebrow">AI Assistant</p>
        <h1 className="section-title-xl">AstroScoutAssistant</h1>
        <p className="section-copy-sm max-w-3xl">
          Ask about observing, celestial objects, or stargazing. For example: What can I see tonight?
        </p>
      </header>

      <div className="glass-panel-strong panel-elevated flex min-h-[34rem] flex-1 flex-col p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-slate-700/70 bg-slate-950/55 px-3 py-1.5">Observation planning</span>
          <span className="rounded-full border border-slate-700/70 bg-slate-950/55 px-3 py-1.5">Celestial objects</span>
          <span className="rounded-full border border-slate-700/70 bg-slate-950/55 px-3 py-1.5">Stargazing tips</span>
        </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 rounded-2xl border border-slate-700/80 bg-slate-950/45 p-4 min-h-[200px]">
        {messages.length === 0 && !loading && (
          <p className="text-slate-500 text-sm">Send a message to start.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-[linear-gradient(135deg,rgba(245,166,35,0.95),rgba(217,93,0,0.9))] px-4 py-3 text-sm text-slate-950 shadow-[0_12px_28px_rgba(245,166,35,0.18)]"
                  : "max-w-[85%] rounded-2xl border border-slate-700/70 bg-slate-900/75 px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/75 px-4 py-3 text-sm text-slate-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {error && (
        <p className="text-amber-400 text-sm mb-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="input-control flex-1"
          disabled={loading}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
      </div>
    </section>
  );
}
