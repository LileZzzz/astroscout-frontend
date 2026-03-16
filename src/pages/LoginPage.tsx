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
    <section className="mx-auto flex min-h-[70vh] w-full max-w-[92rem] items-center justify-center py-10">
      <div className="glass-panel-strong panel-elevated w-full max-w-md p-6 sm:p-7">
        <p className="section-eyebrow">Account Access</p>
        <h1 className="section-title-lg">Sign in to AstroScout</h1>

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
              className="input-control"
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
              className="input-control"
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
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="btn-ghost w-full disabled:opacity-60"
          >
            {submitting ? "Please wait..." : "Try demo account"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Need an account?{" "}
            <a href="/register" className="text-amber-200 hover:text-amber-100">
              Create one here
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}

