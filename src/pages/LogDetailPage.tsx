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
      navigate("/");
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{state.message}</p>
        <Link to="/" className="text-sky-400 hover:text-sky-300 text-sm">
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
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-2xl mx-auto border-x border-slate-800 min-h-screen px-4 py-6">
        <div className="mb-6">
          <Link to="/" className="text-slate-400 hover:text-white text-sm">
            ← Back to Feed
          </Link>
        </div>

        <article className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold text-white break-words">{log.title}</h1>
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

          {log.description && (
            <div className="text-slate-300 whitespace-pre-wrap break-words">
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
                className="hover:text-sky-400"
                onClick={() => navigate(`/logs/${log.id}/edit`)}
              >
                Edit
              </button>
              <button
                type="button"
                className="hover:text-red-400"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          )}
          <div className="flex items-center gap-6 pt-2 border-t border-slate-800">
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

        <section className="mt-8 pt-6 border-t border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Comments</h2>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                maxLength={1000}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="rounded-lg bg-sky-600 text-white px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <li key={c.id} className="flex gap-3">
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
