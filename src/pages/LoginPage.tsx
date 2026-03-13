import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type LoginResponse = {
  userId: number;
  username: string;
  token: string;
  message: string;
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>("/api/auth/login", {
        username,
        password,
      });

      login(
        {
          id: response.data.userId,
          username: response.data.username,
        },
        response.data.token,
      );

      navigate("/");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post<LoginResponse>("/api/auth/demo");
      login(
        {
          id: response.data.userId,
          username: response.data.username,
        },
        response.data.token,
      );
      navigate("/");
    } catch {
      setError("Demo login is currently unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-xl font-semibold mb-4">Sign in to AstroScout</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full rounded-md border border-cyan-300/40 bg-cyan-300/10 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-60"
          >
            {submitting ? "Please wait..." : "Try demo account"}
          </button>
        </form>
      </div>
    </div>
  );
}

