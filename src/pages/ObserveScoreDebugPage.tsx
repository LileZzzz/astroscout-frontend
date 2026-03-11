import { useState } from "react";
import { api } from "../api";

type ScoreResponse = {
  score: number;
  grade: string;
  cloudScore: number;
  moonScore: number;
  lightPollutionScore: number;
  visibilityScore: number;
  weather: unknown;
  astronomy: unknown;
  lightPollution: unknown;
};

export function ObserveScoreDebugPage() {
  const [lat, setLat] = useState("42.36");
  const [lng, setLng] = useState("-71.06");
  const [date, setDate] = useState("2026-03-10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScoreResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await api.get<ScoreResponse>("/api/observe/score", {
        params: { lat, lng, date },
      });
      setData(res.data);
    } catch (err: unknown) {
      setError("Failed to load score. Check backend and parameters.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-2xl px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold">Observe score debug</h1>
        <p className="text-sm text-slate-400">
          Temporary page for testing <code>/api/observe/score</code>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block mb-1">Latitude</span>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">Longitude</span>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Get score"}
          </button>
        </form>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Response</h2>
            <pre className="text-xs bg-slate-900 border border-slate-700 rounded-md p-3 overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
