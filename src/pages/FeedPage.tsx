import { useEffect, useState } from "react";
import { api } from "../api";

type FeedItem = {
  id: number;
  userId: number;
  title: string;
  locationName: string | null;
  observedAt: string;
  isPublic: boolean;
};

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; items: FeedItem[] };

export function FeedPage() {
  const [state, setState] = useState<FeedState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadFeed() {
      try {
        const response = await api.get<FeedItem[]>("/api/feed");
        if (!isMounted) {
          return;
        }
        setState({ status: "loaded", items: response.data });
      } catch {
        if (!isMounted) {
          return;
        }
        setState({
          status: "error",
          message: "Failed to load feed. Please try again.",
        });
      }
    }

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-lg">Loading feed...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-sm text-red-400">{state.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-2xl font-semibold">AstroScout Feed</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {state.items.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}

        {state.items.length === 0 && (
          <p className="text-sm text-slate-400">No public observations yet.</p>
        )}
      </main>
    </div>
  );
}

type FeedCardProps = {
  item: FeedItem;
};

function FeedCard({ item }: FeedCardProps) {
  const observedAt = new Date(item.observedAt);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500/60 transition">
      <h2 className="text-lg font-semibold">{item.title}</h2>
      <p className="text-sm text-slate-400 mt-1">
        {item.locationName ?? "Unknown location"} ·{" "}
        {observedAt.toLocaleString()}
      </p>
    </article>
  );
}

