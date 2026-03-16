import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type ProfileResponse = {
  id: number;
  username: string;
  role: string;
};

type MyLog = {
  id: number;
  title: string;
  observedAt: string;
  locationName: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
};

function CardBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sky-300/35 bg-sky-300/12 text-sky-100">
      {children}
    </span>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h11v16H8" />
      <path d="M5 8h11" />
      <path d="M5 12h11" />
      <path d="M5 16h11" />
    </svg>
  );
}

export function ProfilePage() {
  const { isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [myLogs, setMyLogs] = useState<MyLog[]>([]);

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDemoAccount = profile?.username.toLowerCase().startsWith("demo") ?? false;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, logsRes] = await Promise.all([
          api.get<ProfileResponse>("/api/users/me"),
          api.get<MyLog[]>("/api/logs"),
        ]);

        if (!mounted) return;
        setProfile(profileRes.data);
        setMyLogs(logsRes.data);
        setUsername(profileRes.data.username);
      } catch {
        if (!mounted) return;
        setError("Failed to load your profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, navigate]);

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    if (isDemoAccount) {
      setError("Demo accounts cannot change username.");
      return;
    }

    setSavingProfile(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.put<ProfileResponse>("/api/users/me/profile", {
        username,
      });
      setProfile(res.data);
      updateUser({
        id: res.data.id,
        username: res.data.username,
      });
      setMessage("Profile updated.");
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isDemoAccount) {
      setError("Demo accounts cannot change password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    setMessage(null);
    setError(null);
    try {
      await api.put("/api/users/me/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch {
      setError("Failed to update password. Check your current password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-panel p-6 text-sm text-slate-300">Loading profile...</div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[92rem] space-y-5">
      <header className="glass-panel panel-elevated panel-pad">
        <p className="section-eyebrow">Account</p>
        <h1 className="section-title-xl">My Profile</h1>
        <p className="section-copy-sm">
          Update your username and password, and review your own observation logs.
        </p>
      </header>

      {(message || error) && (
        <div
          className={`glass-panel p-3 text-sm ${error ? "text-red-300" : "text-emerald-300"}`}
          role="status"
        >
          {error ?? message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="glass-panel-strong panel-elevated card-polish space-y-4 p-5">
          <div className="flex items-center gap-3">
            <CardBadge>
              <UserIcon />
            </CardBadge>
            <div className="text-sm text-slate-300">
              <p className="font-semibold text-slate-100">{profile?.username}</p>
              <p className="text-xs text-slate-400">Role: {profile?.role}</p>
            </div>
          </div>

          {isDemoAccount && (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
              Demo account protection is enabled. Username and password changes are disabled for this account.
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label htmlFor="username" className="mb-1 block text-sm">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isDemoAccount}
                required
                className="input-control disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile || isDemoAccount}
              className="btn-primary disabled:opacity-60"
            >
              {savingProfile ? "Saving profile..." : "Save profile"}
            </button>
          </form>

          <form onSubmit={handleChangePassword} className="space-y-3 border-t border-slate-700/70 pt-4">
            <p className="text-sm font-semibold text-slate-100">Change password</p>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              disabled={isDemoAccount}
              required
              className="input-control disabled:cursor-not-allowed disabled:opacity-60"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              disabled={isDemoAccount}
              required
              minLength={8}
              className="input-control disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={savingPassword || isDemoAccount}
              className="btn-ghost disabled:opacity-60"
            >
              {savingPassword ? "Updating password..." : "Update password"}
            </button>
          </form>
        </section>

        <section className="glass-panel-strong panel-elevated card-polish p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardBadge>
                <LogsIcon />
              </CardBadge>
              <h2 className="text-xl font-semibold text-slate-50">My Logs</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/logs/new" className="btn-primary">
                New log
              </Link>
            </div>
          </div>

          {myLogs.length === 0 ? (
            <p className="text-sm text-slate-400">You have not posted any logs yet.</p>
          ) : (
            <ul className="space-y-3">
              {myLogs.map((log) => (
                <li key={log.id} className="card-polish rounded-xl border border-slate-700/80 bg-slate-900/55 p-3">
                  {log.coverImageUrl && (
                    <img
                      src={log.coverImageUrl}
                      alt={log.title}
                      className="mb-3 h-40 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/logs/${log.id}`} className="font-semibold text-slate-100 hover:text-cyan-200">
                      {log.title}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {new Date(log.observedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{log.locationName ?? "Unknown location"}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{log.isPublic ? "Public" : "Private"}</span>
                    <Link to={`/logs/${log.id}/edit`} className="hover:text-cyan-200">
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
