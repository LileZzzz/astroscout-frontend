import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

type FeedItem = {
  id: number;
  userId: number;
  username: string | null;
  title: string;
  locationName: string | null;
  observedAt: string;
  isPublic: boolean;
};

const PAGE_SIZE = 20;

type FeedPageResponse = {
  content: FeedItem[];
  hasMore: boolean;
};

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; items: FeedItem[]; hasMore: boolean; loadingMore: boolean };

export function FeedPage() {
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFeed() {
      try {
        const response = await api.get<FeedPageResponse>("/api/feed", {
          params: { page: 0, size: PAGE_SIZE },
        });
        if (!isMounted) return;
        const { content, hasMore } = response.data;
        setState({ status: "loaded", items: content, hasMore, loadingMore: false });
      } catch {
        if (!isMounted) return;
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

  const loadMore = async () => {
    if (state.status !== "loaded" || state.loadingMore || !state.hasMore) return;
    setState((s) => (s.status === "loaded" ? { ...s, loadingMore: true } : s));
    const nextPage = Math.floor(state.items.length / PAGE_SIZE);
    try {
      const response = await api.get<FeedPageResponse>("/api/feed", {
        params: { page: nextPage, size: PAGE_SIZE },
      });
      const { content, hasMore } = response.data;
      setState((s) =>
        s.status === "loaded"
          ? {
              ...s,
              items: [...s.items, ...content],
              hasMore,
              loadingMore: false,
            }
          : s
      );
    } catch {
      setState((s) =>
        s.status === "loaded" ? { ...s, loadingMore: false } : s
      );
    }
  };

  useEffect(() => {
    if (state.status !== "loaded") return;
    const { hasMore, loadingMore } = state;
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when state (items/hasMore/loadingMore) changes; loadMore uses current state
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm text-red-400">{state.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-2xl mx-auto border-x border-slate-800 min-h-screen">
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-slate-800 px-4 py-3">
          <h1 className="text-xl font-bold">Feed</h1>
        </header>

        <div className="divide-y divide-slate-800">
          {state.items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>

        {state.items.length === 0 && !state.loadingMore && (
          <div className="py-12 text-center text-slate-500 text-sm">
            No posts yet.
          </div>
        )}

        {state.status === "loaded" && state.hasMore && (
          <div
            ref={sentinelRef}
            className="py-6 flex justify-center text-slate-500 text-sm"
          >
            {state.loadingMore ? "Loading more..." : ""}
          </div>
        )}
      </main>
    </div>
  );
}

type FeedCardProps = {
  item: FeedItem;
};

function FeedCard({ item }: FeedCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [updatingLike, setUpdatingLike] = useState(false);

  const observedAt = new Date(item.observedAt);
  const timeAgo = formatTimeAgo(observedAt);

  useEffect(() => {
    let isMounted = true;

    async function loadCountsAndLiked() {
      try {
        const [likesRes, commentsRes] = await Promise.all([
          api.get<number>(`/api/logs/${item.id}/likes/count`),
          api.get<number>(`/api/logs/${item.id}/comments/count`),
        ]);
        if (!isMounted) return;
        setLikeCount(likesRes.data);
        setCommentCount(commentsRes.data);

        if (isAuthenticated) {
          const meRes = await api.get<{ liked: boolean }>(`/api/logs/${item.id}/likes/me`);
          if (!isMounted) return;
          setLiked(meRes.data.liked);
        }
      } catch {
        if (!isMounted) return;
        setLikeCount(0);
        setCommentCount(0);
      }
    }

    loadCountsAndLiked();

    return () => {
      isMounted = false;
    };
  }, [item.id, isAuthenticated]);

  async function handleLike() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setUpdatingLike(true);
    try {
      if (liked) {
        await api.delete(`/api/logs/${item.id}/like`);
        setLiked(false);
        setLikeCount((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      } else {
        await api.post(`/api/logs/${item.id}/like`);
        setLiked(true);
        setLikeCount((prev) => (prev !== null ? prev + 1 : 1));
      }
    } catch {
      // keep UI state on error
    } finally {
      setUpdatingLike(false);
    }
  }

  return (
    <article className="px-4 py-3 hover:bg-slate-900/30 transition-colors">
      <div
        className="flex gap-3 cursor-pointer"
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/logs/${item.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/logs/${item.id}`);
          }
        }}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">
          {(item.username ?? String(item.userId)).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-white">{item.username ?? `User ${item.userId}`}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">{timeAgo}</span>
          </div>
          <h2 className="text-[15px] font-normal text-white mt-0.5 break-words">
            {item.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {item.locationName ?? "Unknown location"}
          </p>
          <div className="flex items-center gap-6 mt-3 text-slate-500">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={updatingLike}
              className="inline-flex items-center gap-1.5 text-sm hover:text-red-400 disabled:opacity-60 transition-colors"
              aria-label={liked ? "Unlike" : "Like"}
            >
              <span className={liked ? "text-red-400" : ""}>
                {liked ? "♥" : "♡"}
              </span>
              <span>{likeCount !== null ? likeCount : "–"}</span>
            </button>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span aria-hidden>💬</span>
              <span>{commentCount !== null ? commentCount : "–"}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d`;
  return date.toLocaleDateString();
}
