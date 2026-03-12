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
    <div className="max-w-2xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col p-4">
      <h1 className="text-lg font-semibold text-slate-200 mb-2">
        AI Astronomy Assistant
      </h1>
      <p className="text-sm text-slate-500 mb-4">
        Ask about observing, celestial objects, or stargazing. E.g. What can I see tonight?
      </p>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 min-h-[200px]">
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
                  ? "max-w-[85%] rounded-lg bg-sky-600/80 text-white px-3 py-2 text-sm"
                  : "max-w-[85%] rounded-lg bg-slate-700 text-slate-200 px-3 py-2 text-sm whitespace-pre-wrap"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-700 text-slate-400 px-3 py-2 text-sm">
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
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          disabled={loading}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
