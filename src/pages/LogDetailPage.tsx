import type React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type LogDetail = {
  id: number;
  userId: number;
  username: string;
  title: string;
  description: string | null;
  observedAt: string;
  locationName: string | null;
  coverImageUrl: string | null;
  lat: number;
  lng: number;
  bortleScale: number | null;
  weatherCondition: string | null;
  seeingRating: number | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string | null;
};

type CommentItem = {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
};

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; log: LogDetail; comments: CommentItem[] };

function CardBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
      {children}
    </span>
  );
}

function DetailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16v10H8l-4 4z" />
    </svg>
  );
}

export function LogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [updatingLike, setUpdatingLike] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!id) {
        setState({ status: "error", message: "Invalid log id." });
        return;
      }
      try {
        const [logRes, commentsRes, likesCountRes] = await Promise.all([
          api.get<LogDetail>(`/api/logs/${id}`),
          api.get<CommentItem[]>(`/api/logs/${id}/comments`),
          api.get<number>(`/api/logs/${id}/likes/count`),
        ]);
        if (!isMounted) return;
        setState({
          status: "loaded",
          log: logRes.data,
          comments: commentsRes.data,
        });
        setLikeCount(likesCountRes.data);

        if (isAuthenticated) {
          const meRes = await api.get<{ liked: boolean }>(`/api/logs/${id}/likes/me`);
          if (!isMounted) return;
          setLiked(meRes.data.liked);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const ax = err as { response?: { status: number; data?: unknown } };
        if (ax.response?.status === 404) {
          setState({ status: "error", message: "Log not found." });
        } else if (ax.response?.status === 403) {
          setState({ status: "error", message: "You don't have access to this log." });
        } else {
          setState({
            status: "error",
            message: "Failed to load log. Please try again.",
          });
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  async function handleLike() {
    if (!id) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setUpdatingLike(true);
    try {
      if (liked) {
        await api.delete(`/api/logs/${id}/like`);
        setLiked(false);
        setLikeCount((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      } else {
        await api.post(`/api/logs/${id}/like`);
        setLiked(true);
        setLikeCount((prev) => (prev !== null ? prev + 1 : 1));
      }
    } catch {
      // keep UI state
    } finally {
      setUpdatingLike(false);
    }
  }
  async function handleDelete() {
    if (!id) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const confirmed = window.confirm("Delete this observation? This cannot be undone.");
    if (!confirmed) return;
    try {
      await api.delete(`/api/logs/${id}`);
      navigate("/community");
    } catch (err: unknown) {
      const ax = err as { response?: { status: number } };
      if (ax.response?.status === 403) {
        alert("You are not allowed to delete this log.");
      } else {
        alert("Failed to delete log. Please try again.");
      }
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !commentText.trim() || submittingComment) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setSubmittingComment(true);
    try {
      const res = await api.post<CommentItem>(`/api/logs/${id}/comments`, {
        content: commentText.trim(),
      });
      setState((prev) => {
        if (prev.status !== "loaded") return prev;
        return {
          ...prev,
          comments: [...prev.comments, res.data],
        };
      });
      setCommentText("");
    } catch {
      // could show toast
    } finally {
      setSubmittingComment(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel px-6 py-4 text-slate-300">Loading...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="glass-panel border-red-300/40 px-6 py-4 text-red-300">{state.message}</div>
        <Link to="/" className="text-cyan-200 hover:text-cyan-100 text-sm">
          Back to Feed
        </Link>
      </div>
    );
  }

  const { log, comments } = state;
  const observedAt = new Date(log.observedAt);
  const isOwner = isAuthenticated && user && user.id === log.userId;

  async function handleDeleteComment(commentId: number) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await api.delete(`/api/logs/${log.id}/comments/${commentId}`);
      setState((prev) => {
        if (prev.status !== "loaded") return prev;
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== commentId),
        };
      });
    } catch {
      // could show toast
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-[92rem] px-3 py-6 sm:px-4">
        <div className="glass-panel-strong panel-elevated card-polish min-h-[70vh] p-4 sm:p-6">
        <div className="mb-6">
          <Link to="/community" className="text-slate-400 hover:text-white text-sm">
            ← Back to Feed
          </Link>
        </div>

        <article className="space-y-4">
          <header>
            <p className="section-eyebrow">Observation Log</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="section-title-xl mt-0 break-words text-2xl sm:text-4xl">{log.title}</h1>
              <CardBadge>
                <DetailIcon />
              </CardBadge>
            </div>
            <div className="flex items-baseline gap-2 text-sm text-slate-500 mt-2">
              <span className="font-medium text-slate-300">{log.username}</span>
              <span>·</span>
              <time dateTime={log.observedAt}>
                {observedAt.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
            {log.locationName && (
              <p className="text-slate-500 text-sm mt-1">{log.locationName}</p>
            )}
          </header>

          {log.coverImageUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/50">
              <img
                src={log.coverImageUrl}
                alt={log.title}
                className="max-h-[460px] w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {log.description && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/45 p-4 text-slate-300 whitespace-pre-wrap break-words leading-7">
              {log.description}
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            {log.bortleScale != null && (
              <span>Bortle {log.bortleScale}</span>
            )}
            {log.weatherCondition && (
              <span>{log.weatherCondition}</span>
            )}
            {log.seeingRating != null && (
              <span>Seeing {log.seeingRating}</span>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigate(`/logs/${log.id}/edit`)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost text-red-200 hover:text-red-100"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          )}
          <div className="flex items-center gap-6 pt-2 border-t border-slate-700/80">
            <button
              type="button"
              onClick={handleLike}
              disabled={updatingLike}
              className="inline-flex items-center gap-1.5 text-sm hover:text-red-400 disabled:opacity-60 transition-colors"
              aria-label={liked ? "Unlike" : "Like"}
            >
              <span className={liked ? "text-red-400" : ""}>
                {liked ? "♥" : "♡"}
              </span>
              <span>{likeCount !== null ? likeCount : "–"}</span>
            </button>
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
              <span aria-hidden>💬</span>
              <span>{comments.length}</span>
            </span>
          </div>
        </article>

        <section className="mt-8 pt-6 border-t border-slate-700/80">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-title-lg mt-0 text-lg">Comments</h2>
            <CardBadge>
              <CommentIcon />
            </CardBadge>
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                maxLength={1000}
                className="input-control min-h-[7rem] resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingComment ? "Posting..." : "Post comment"}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-slate-500 text-sm mb-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sky-400 hover:text-sky-300 underline"
              >
                Log in
              </button>{" "}
              to post a comment.
            </p>
          )}

          <ul className="space-y-4">
            {comments.map((c) => {
              const canDelete =
                isAuthenticated &&
                user &&
                (user.id === c.userId || user.id === log.userId);
              return (
                <li key={c.id} className="glass-panel card-polish flex gap-3 p-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                    {(c.username ?? String(c.userId)).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="font-semibold text-slate-200">
                        {c.username}
                      </span>
                      <span className="text-slate-500">
                        {formatTimeAgo(new Date(c.createdAt))}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="ml-3 text-xs text-slate-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mt-0.5 break-words whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {comments.length === 0 && (
            <p className="text-slate-500 text-sm">No comments yet.</p>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}
