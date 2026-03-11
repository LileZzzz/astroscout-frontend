import { useEffect, useRef, useState } from "react";
import { api } from "../api";

type ScoreResponse = {
  score: number;
  grade: string;
  cloudScore: number;
  moonScore: number;
  lightPollutionScore: number;
  visibilityScore: number;
  weather: {
    cloudCoverPercent: number;
    visibilityKm: number;
    humidityPercent: number;
    windSpeedMps: number;
  };
  astronomy: {
    moonPhase: number;
    moonPhaseLabel: string;
  };
  lightPollution: {
    bortleScale: number;
  };
};

type CelestialTarget = {
  name: string;
  type: string;
  alt: number;
  az: number;
  magnitude: number;
  needsTelescope: boolean;
  description: string;
};

type BestWindow = {
  start: string;
  end: string;
  quality: string;
  reason: string;
};

export function ObservationPlannerPage() {
  const [lat, setLat] = useState("42.3601");
  const [lng, setLng] = useState("-71.0589");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [targets, setTargets] = useState<CelestialTarget[]>([]);
  const [bestWindows, setBestWindows] = useState<BestWindow[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown | null>(null);

  useEffect(() => {
    const anyWindow = window as unknown as { L?: { map: unknown; tileLayer: unknown; marker: unknown } | undefined };
    if (!anyWindow.L) return;
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    const leaflet = anyWindow.L as {
      map: (el: HTMLElement) => { setView: (coords: [number, number], zoom: number) => unknown; on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void; remove: () => void };
      tileLayer: (url: string, options: { attribution: string; maxZoom: number }) => { addTo: (mapInstance: unknown) => void };
      marker: (coords: [number, number]) => { addTo: (mapInstance: unknown) => { setLatLng: (coords: [number, number]) => void } };
    };
    const initialLat = parseFloat(lat) || 0;
    const initialLng = parseFloat(lng) || 0;
    const map = leaflet.map(mapContainerRef.current) as unknown as {
      setView: (coords: [number, number], zoom: number) => unknown;
      on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void;
      remove: () => void;
    };
    map.setView([initialLat, initialLng], 5);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      })
      .addTo(map as unknown as object);

    const marker = leaflet.marker([initialLat, initialLng]).addTo(map as unknown as object) as {
      setLatLng: (coords: [number, number]) => void;
    };

    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const clampedLat = Math.max(-90, Math.min(90, clickLat));
      const wrappedLng =
        ((clickLng + 180 + 360) % 360) - 180; // normalize to [-180, 180]

      marker.setLatLng([clampedLat, wrappedLng]);
      setLat(clampedLat.toFixed(6));
      setLng(wrappedLng.toFixed(6));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    setTargets([]);
    setBestWindows([]);
    try {
      const [scoreRes, celestialRes, bestWindowRes] = await Promise.all([
        api.get<ScoreResponse>("/api/observe/score", {
          params: { lat, lng, date },
        }),
        api.get<CelestialTarget[]>("/api/observe/celestial", {
          params: { lat, lng, date },
        }),
        api.get<BestWindow[]>("/api/observe/best-window", {
          params: { lat, lng, date },
        }),
      ]);
      setData(scoreRes.data);
      setTargets(celestialRes.data);
      setBestWindows(bestWindowRes.data);
    } catch {
      setError("Failed to load observing score or targets. Please check inputs and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-3xl px-4 py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Observation planner</h1>
          <p className="text-sm text-slate-400">
            Enter a location and date to estimate tonight&apos;s observing quality.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="block mb-1">
                Latitude <span className="text-sky-400">*</span>
              </span>
              <input
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">
                Longitude <span className="text-sky-400">*</span>
              </span>
              <input
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">
                Date <span className="text-sky-400">*</span>
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>

          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-1">
              Or click on the map to choose coordinates:
            </p>
            <div
              ref={mapContainerRef}
              className="h-64 rounded-lg border border-slate-800 overflow-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? "Calculating..." : "Calculate observing score"}
          </button>

          {error && (
            <p className="text-sm text-red-400 mt-2" role="alert">
              {error}
            </p>
          )}
        </form>

        {data && (
          <section className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Overall score</p>
                <p className="text-3xl font-semibold">
                  {Math.round(data.score)}
                  <span className="text-base text-slate-400 ml-1">/ 100</span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Grade</p>
                <p className="text-xl font-semibold">{data.grade}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <ScoreTile label="Clouds" value={data.cloudScore} />
              <ScoreTile label="Moon" value={data.moonScore} />
              <ScoreTile label="Light pollution" value={data.lightPollutionScore} />
              <ScoreTile label="Visibility" value={data.visibilityScore} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-slate-100 text-sm">Weather</p>
                <p>Cloud cover: {data.weather.cloudCoverPercent}%</p>
                <p>Visibility: {data.weather.visibilityKm} km</p>
                <p>Humidity: {data.weather.humidityPercent}%</p>
                <p>Wind: {data.weather.windSpeedMps} m/s</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-slate-100 text-sm">Astronomy</p>
                <p>Moon phase: {data.astronomy.moonPhaseLabel}</p>
                <p>
                  Illuminated fraction:{" "}
                  {Math.round(data.astronomy.moonPhase * 100)}%
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-slate-100 text-sm">Light pollution</p>
                <p>Bortle scale: {data.lightPollution.bortleScale}</p>
              </div>
            </div>

            {bestWindows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-100">Best observing windows (astronomy only)</p>
                <ul className="space-y-2 text-xs text-slate-300">
                  {bestWindows.map((w, idx) => (
                    <li
                      key={`${w.start}-${w.end}-${idx}`}
                      className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">
                          {w.start.slice(0, 5)} – {w.end.slice(0, 5)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                          {w.quality}
                        </span>
                      </div>
                      <p className="text-slate-400">{w.reason}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-slate-500">
                  Note: These windows are based on moon phase and a generic night-time range, not detailed hourly weather yet.
                </p>
              </div>
            )}

            {targets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-100">Tonight&apos;s suggested targets</p>
                <ul className="space-y-2 text-xs text-slate-300">
                  {targets.map((t) => (
                    <li
                      key={t.name}
                      className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-100 text-sm">{t.name}</p>
                        <p className="text-slate-400">
                          {t.type} · mag {t.magnitude.toFixed(1)} · alt {Math.round(t.alt)}° · az {Math.round(t.az)}°
                        </p>
                      </div>
                      <div className="text-right md:text-left">
                        <p className="text-slate-300 mb-1">{t.description}</p>
                        <p className="text-slate-500">
                          {t.needsTelescope ? "Needs telescope" : "Binocular / naked eye friendly"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

type ScoreTileProps = {
  label: string;
  value: number;
};

function ScoreTile({ label, value }: ScoreTileProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold">{Math.round(value)}</p>
    </div>
  );
}

