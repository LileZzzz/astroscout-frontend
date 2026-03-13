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

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatPayload = {
  message: string;
  lat: number;
  lng: number;
  date: string;
  score?: number;
  weatherSummary?: string;
  moonPhaseLabel?: string;
  bortleScale?: number;
  targetSummary?: string;
};

const AUTO_SUMMARY_PROMPT =
  "Summarize tonight's weather and sky conditions in plain language, then give 3 practical observing suggestions and one backup plan if conditions worsen.";

function wrapLongitude(value: number): number {
  return ((value + 180 + 360) % 360) - 180;
}

export function ObservationPlannerPage() {
  const minPlannerDate = new Date().toISOString().slice(0, 10);
  const [lat, setLat] = useState("42.3601");
  const [lng, setLng] = useState("-71.0589");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [targets, setTargets] = useState<CelestialTarget[]>([]);
  const [bestWindows, setBestWindows] = useState<BestWindow[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown | null>(null);
  const mapMarkerRef = useRef<{ setLatLng: (coords: [number, number]) => void } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    const anyWindow = window as unknown as {
      L?: { map: unknown; tileLayer: unknown; marker: unknown } | undefined;
    };
    if (!anyWindow.L) return;
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    const leaflet = anyWindow.L as {
      map: (el: HTMLElement, options?: { worldCopyJump?: boolean }) => {
        setView: (coords: [number, number], zoom: number) => unknown;
        panTo: (coords: [number, number]) => unknown;
        on: (event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void) => void;
        remove: () => void;
      };
      tileLayer: (url: string, options: { attribution: string; maxZoom: number }) => { addTo: (mapInstance: unknown) => void };
      marker: (coords: [number, number]) => { addTo: (mapInstance: unknown) => { setLatLng: (coords: [number, number]) => void } };
    };

    const initialLat = parseFloat(lat) || 0;
    const initialLng = wrapLongitude(parseFloat(lng) || 0);
    const map = leaflet.map(mapContainerRef.current, { worldCopyJump: true }) as unknown as {
      setView: (coords: [number, number], zoom: number) => unknown;
      panTo: (coords: [number, number]) => unknown;
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
    mapMarkerRef.current = marker;

    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const clampedLat = Math.max(-90, Math.min(90, clickLat));
      const wrappedLng = wrapLongitude(clickLng);
      marker.setLatLng([clampedLat, wrappedLng]);
      setLat(clampedLat.toFixed(6));
      setLng(wrappedLng.toFixed(6));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      mapMarkerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const marker = mapMarkerRef.current;
    const map = mapInstanceRef.current as {
      panTo: (coords: [number, number]) => unknown;
    } | null;
    if (!marker || !map) return;

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return;

    const clampedLat = Math.max(-90, Math.min(90, parsedLat));
    const wrappedLng = wrapLongitude(parsedLng);
    marker.setLatLng([clampedLat, wrappedLng]);
    map.panTo([clampedLat, wrappedLng]);
  }, [lat, lng]);

  function buildChatPayload(message: string, scoreData: ScoreResponse | null, targetList: CelestialTarget[]): ChatPayload {
    const payload: ChatPayload = {
      message,
      lat: Number(lat),
      lng: Number(lng),
      date,
    };

    if (scoreData) {
      payload.score = Math.round(scoreData.score);
      payload.weatherSummary = `cloud=${scoreData.weather.cloudCoverPercent}%, visibility=${scoreData.weather.visibilityKm}km, humidity=${scoreData.weather.humidityPercent}%, wind=${scoreData.weather.windSpeedMps}m/s`;
      payload.moonPhaseLabel = scoreData.astronomy.moonPhaseLabel;
      payload.bortleScale = scoreData.lightPollution.bortleScale;
    }

    if (targetList.length > 0) {
      payload.targetSummary = targetList
        .slice(0, 5)
        .map((t) => `${t.name} (${t.type}, alt ${Math.round(t.alt)}°, mag ${t.magnitude.toFixed(1)})`)
        .join("; ");
    }

    return payload;
  }

  async function requestAssistantMessage(message: string, scoreData: ScoreResponse | null, targetList: CelestialTarget[], appendUserBubble: boolean) {
    if (chatLoading) return;

    setChatError(null);
    if (appendUserBubble) {
      setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    }
    setChatLoading(true);

    try {
      const payload = buildChatPayload(message, scoreData, targetList);
      const res = await api.post<{ answer: string }>("/api/ai/chat", payload);
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.data.answer }]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Request failed";
      setChatError(String(msg || "Failed to get response"));
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, the assistant is unavailable right now. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (date < minPlannerDate) {
      setError("Planner date must be today or later.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    setTargets([]);
    setBestWindows([]);

    try {
      const [scoreRes, celestialRes, bestWindowRes] = await Promise.all([
        api.get<ScoreResponse>("/api/observe/score", { params: { lat, lng, date } }),
        api.get<CelestialTarget[]>("/api/observe/celestial", { params: { lat, lng, date } }),
        api.get<BestWindow[]>("/api/observe/best-window", { params: { lat, lng, date } }),
      ]);

      setData(scoreRes.data);
      setTargets(celestialRes.data);
      setBestWindows(bestWindowRes.data);
      void requestAssistantMessage(AUTO_SUMMARY_PROMPT, scoreRes.data, celestialRes.data, false);
    } catch {
      setError("Failed to load observing score or targets. Please check inputs and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAskAi(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatInput("");
    await requestAssistantMessage(text, data, targets, true);
  }

  return (
    <section className="mx-auto w-full max-w-[92rem] space-y-6">
      <header className="glass-panel p-6">
        <p className="label-muted">Planner Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Observation Planner Workspace</h1>
        <p className="mt-2 text-sm text-slate-300">
          Select location and date on the left. The AI on the right uses your selected coordinates and injected observing context to provide recommendations.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="glass-panel-strong space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block">
                  Latitude <span className="text-cyan-300">*</span>
                </span>
                <input
                  type="number"
                  step="0.000001"
                  min={-90}
                  max={90}
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/75 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">
                  Longitude <span className="text-cyan-300">*</span>
                </span>
                <input
                  type="number"
                  step="0.000001"
                  min={-180}
                  max={180}
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/75 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">
                  Date <span className="text-cyan-300">*</span>
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minPlannerDate}
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/75 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 p-3">
              <p className="mb-2 text-xs text-slate-400">Click on the map to choose coordinates:</p>
              <div ref={mapContainerRef} className="h-[28rem] overflow-hidden rounded-xl border border-slate-700/70 sm:h-[34rem]" />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? "Calculating..." : "Calculate observing score"}
              </button>
              {error && (
                <p className="text-sm text-red-300" role="alert">
                  {error}
                </p>
              )}
            </div>
          </form>

          {data && (
            <section className="space-y-4">
              <div className="glass-panel-strong flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="label-muted">Overall score</p>
                  <p className="mt-1 text-4xl font-semibold text-slate-50">
                    {Math.round(data.score)}
                    <span className="ml-2 text-base font-medium text-slate-400">/ 100</span>
                  </p>
                </div>
                <div>
                  <p className="label-muted">Grade</p>
                  <p className="mt-1 text-2xl font-semibold text-cyan-200">{data.grade}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <ScoreTile label="Clouds" value={data.cloudScore} />
                <ScoreTile label="Moon" value={data.moonScore} />
                <ScoreTile label="Light pollution" value={data.lightPollutionScore} />
                <ScoreTile label="Visibility" value={data.visibilityScore} />
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs text-slate-200 md:grid-cols-3">
                <div className="glass-panel p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-slate-100">Weather</p>
                  <p>Cloud cover: {data.weather.cloudCoverPercent}%</p>
                  <p>Visibility: {data.weather.visibilityKm} km</p>
                  <p>Humidity: {data.weather.humidityPercent}%</p>
                  <p>Wind: {data.weather.windSpeedMps} m/s</p>
                </div>
                <div className="glass-panel p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-slate-100">Astronomy</p>
                  <p>Moon phase: {data.astronomy.moonPhaseLabel}</p>
                  <p>Illuminated fraction: {Math.round(data.astronomy.moonPhase * 100)}%</p>
                </div>
                <div className="glass-panel p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-slate-100">Light pollution</p>
                  <p>Bortle scale: {data.lightPollution.bortleScale}</p>
                </div>
              </div>

              {bestWindows.length > 0 && (
                <div className="glass-panel p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-100">Best observing windows</p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {bestWindows.map((w, idx) => (
                      <li key={`${w.start}-${w.end}-${idx}`} className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100">
                            {w.start.slice(0, 5)} - {w.end.slice(0, 5)}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                            {w.quality}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-400">{w.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {targets.length > 0 && (
                <div className="glass-panel p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-100">Suggested targets</p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {targets.map((t) => (
                      <li key={t.name} className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{t.name}</p>
                            <p className="text-slate-400">
                              {t.type} · mag {t.magnitude.toFixed(1)} · alt {Math.round(t.alt)}° · az {Math.round(t.az)}°
                            </p>
                          </div>
                          <div className="md:text-right">
                            <p className="text-slate-300">{t.description}</p>
                            <p className="text-slate-500">
                              {t.needsTelescope ? "Needs telescope" : "Binocular or naked-eye friendly"}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="glass-panel-strong z-10 flex min-h-[560px] flex-col p-4 sm:p-5 xl:sticky xl:top-36 xl:h-[calc(100vh-11rem)] xl:max-h-[780px]">
          <div className="mb-3">
            <h2 className="mt-1 text-xl font-semibold text-slate-50">AstroScoutAssistant</h2>
            <p className="mt-2 text-xs text-slate-300">
              Prompt context includes selected date and coordinates. When available, score, weather, moon phase, light pollution, and suggested targets are injected automatically.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-950/45 p-3">
            {chatMessages.length === 0 && !chatLoading && (
              <p className="text-sm text-slate-400">
                Ask about tonight&apos;s recommendation, target priority, shooting strategy, or backup plans.
              </p>
            )}

            <div className="space-y-3">
              {chatMessages.map((m, idx) => (
                <div key={`${m.role}-${idx}`} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[92%] rounded-xl bg-cyan-300/20 px-3 py-2 text-sm text-cyan-100"
                        : "max-w-[92%] rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 whitespace-pre-wrap"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-400">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {chatError && <p className="mt-2 text-xs text-amber-300">{chatError}</p>}

          <form onSubmit={handleAskAi} className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask based on selected location/date..."
              maxLength={2000}
              disabled={chatLoading}
              className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950/75 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              Send
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}

type ScoreTileProps = {
  label: string;
  value: number;
};

function ScoreTile({ label, value }: ScoreTileProps) {
  return (
    <div className="metric-tile">
      <p className="label-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-50">{Math.round(value)}</p>
    </div>
  );
}
