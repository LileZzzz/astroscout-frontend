import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type RegisterResponse = {
  userId: number;
  username: string;
  token: string | null;
  message: string;
};

export function RegisterPage() {
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
      await api.post<RegisterResponse>("/api/auth/register", {
        username,
        password,
      });

      navigate("/login");
    } catch {
      setError("Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-[92rem] items-center justify-center py-10">
      <div className="glass-panel-strong panel-elevated w-full max-w-md p-6 sm:p-7">
        <p className="section-eyebrow">New Account</p>
        <h1 className="section-title-lg">Create an AstroScout account</h1>
        <p className="section-copy-sm">
          Register once to save planner results, post observing logs, and join the community.
        </p>

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
              autoComplete="new-password"
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
            {submitting ? "Creating account..." : "Sign up"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <a href="/login" className="text-amber-200 hover:text-amber-100">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}

