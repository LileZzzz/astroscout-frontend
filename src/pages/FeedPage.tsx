import type React from "react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

type FeedItem = {
  id: number;
  userId: number;
  username: string | null;
  title: string;
  locationName: string | null;
  coverImageUrl: string | null;
  observedAt: string;
  isPublic: boolean;
};

const PAGE_SIZE = 20;

function CardBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
      {children}
    </span>
  );
}

function LogIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

type FeedPageResponse = {
  content: FeedItem[];
  hasMore: boolean;
};

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; items: FeedItem[]; hasMore: boolean; loadingMore: boolean };

export function FeedPage() {
  const { isAuthenticated } = useAuth();
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
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="glass-panel px-6 py-4 text-sm text-slate-300">Loading feed...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="glass-panel border-red-300/40 px-6 py-4 text-sm text-red-300">
          {state.message}
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[92rem] space-y-5">
      <header className="glass-panel panel-elevated panel-pad">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-eyebrow">Community</p>
            <h1 className="section-title-xl">Observation Feed</h1>
            <p className="section-copy-sm max-w-2xl text-slate-200">
              Track recent sessions from the AstroScout community and open each log for details.
            </p>
          </div>
          <div className="md:pb-1">
            {isAuthenticated && (
              <Link to="/logs/new" className="btn-primary">
                New log
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/login" className="btn-ghost">
                Log in to publish
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {state.items.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}

        {state.items.length === 0 && !state.loadingMore && (
          <div className="glass-panel p-10 text-center text-sm text-slate-500 xl:col-span-2">
            No public observations yet.
          </div>
        )}

        {state.status === "loaded" && state.hasMore && (
          <div
            ref={sentinelRef}
            className="flex justify-center py-4 text-sm text-slate-500 xl:col-span-2"
          >
            {state.loadingMore ? "Loading more posts..." : ""}
          </div>
        )}
      </div>
    </section>
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
    <article className="glass-panel panel-elevated card-polish overflow-hidden p-5 sm:p-6">
      {item.coverImageUrl && (
        <div className="mb-5 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-200/40">
          <img
            src={item.coverImageUrl}
            alt={item.title}
            loading="lazy"
            className="h-64 w-full object-cover"
          />
        </div>
      )}
      <div
        className="flex cursor-pointer gap-4"
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
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/12 text-sm font-semibold text-cyan-100">
          {(item.username ?? String(item.userId)).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-white">{item.username ?? `User ${item.userId}`}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{timeAgo}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <CardBadge>
              <LogIcon />
            </CardBadge>
            <h2 className="break-words text-lg font-semibold text-slate-50">
              {item.title}
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {item.locationName ?? "Unknown location"}
          </p>
          <div className="mt-4 flex items-center gap-6 text-slate-400">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={updatingLike}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/65 px-3 py-1.5 text-sm hover:border-rose-300/50 hover:text-rose-300 disabled:opacity-60"
              aria-label={liked ? "Unlike" : "Like"}
            >
              <span className={liked ? "font-semibold text-rose-300" : ""}>
                {liked ? "Liked" : "Like"}
              </span>
              <span>{likeCount !== null ? likeCount : "–"}</span>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/65 px-3 py-1.5 text-sm">
              <span>Comments</span>
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
