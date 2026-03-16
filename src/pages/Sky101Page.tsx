import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  FILTER_LABELS,
  type SkyCategory,
  type SkyObject,
  type SkyScene,
} from "../types/sky101";

type FilterState = Record<SkyCategory, boolean>;

const SkySceneCanvas = lazy(() =>
  import("../components/SkySceneCanvas").then((module) => ({ default: module.SkySceneCanvas })),
);

export function Sky101Page() {
  const [sceneData, setSceneData] = useState<SkyScene | null>(null);
  const [selected, setSelected] = useState<SkyObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    PLANET: true,
    CONSTELLATION: true,
    GALAXY: true,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<SkyScene>("/api/sky101/scene");
        if (!mounted) return;
        setSceneData(res.data);
      } catch {
        if (!mounted) return;
        setError("Failed to load star map data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleObjects = useMemo(() => {
    return (sceneData?.objects ?? []).filter((obj) => filters[obj.category]);
  }, [sceneData, filters]);

  useEffect(() => {
    if (selected && !filters[selected.category]) {
      setSelected(null);
    }
  }, [filters, selected]);

  const selectedCategoryTone = useMemo(() => {
    if (!selected) return "text-slate-300";
    if (selected.category === "PLANET") return "text-cyan-200";
    if (selected.category === "CONSTELLATION") return "text-amber-200";
    return "text-emerald-200";
  }, [selected]);

  const selectedFactCards = useMemo(() => {
    if (!selected?.facts) return [];

    return [
      { label: "Distance from Earth", value: selected.facts.distanceFromEarth },
      { label: "Diameter", value: selected.facts.diameter },
      { label: "Mass", value: selected.facts.mass },
      {
        label: "Known moons",
        value:
          selected.facts.moonCount === null || selected.facts.moonCount === undefined
            ? null
            : String(selected.facts.moonCount),
      },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  }, [selected]);

  function toggleFilter(category: SkyCategory) {
    setFilters((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  return (
    <section className="mx-auto w-full max-w-[92rem] space-y-5">
      <header className="glass-panel panel-elevated px-5 py-6 sm:px-6 sm:py-7">
        <p className="section-eyebrow">Sky 101</p>
        <h1 className="section-title-xl max-w-4xl text-4xl sm:text-5xl">
          Interactive Star Map Classroom
        </h1>
        <p className="section-copy max-w-3xl sm:text-lg">
          Explore a solar-system style teaching map, watch the planets orbit the Sun, and
          inspect famous celestial objects through a cleaner mission-brief layout.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="glass-panel-strong panel-elevated p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/30 p-2">
            {(["PLANET", "CONSTELLATION", "GALAXY"] as SkyCategory[]).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleFilter(category)}
                className={filters[category] ? "btn-primary" : "btn-ghost"}
              >
                {FILTER_LABELS[category]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowLabels((prev) => !prev)}
              className={showLabels ? "btn-primary" : "btn-ghost"}
            >
              {showLabels ? "Labels on" : "Labels off"}
            </button>
            <button
              type="button"
              onClick={() => setShowConstellationLines((prev) => !prev)}
              className={showConstellationLines ? "btn-primary" : "btn-ghost"}
            >
              {showConstellationLines ? "Constellation lines on" : "Constellation lines off"}
            </button>
          </div>

          {loading && <p className="p-4 text-sm text-slate-300">Loading star map...</p>}
          {error && <p className="p-4 text-sm text-red-300">{error}</p>}
          {!loading && !error && (
            <div className="relative overflow-hidden rounded-[1.15rem] border border-slate-700/60 bg-[#050a18] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
              <Suspense
                fallback={
                  <div className="flex h-[42rem] items-center justify-center text-sm text-slate-300 sm:h-[52rem]">
                    Rendering sky scene...
                  </div>
                }
              >
                <SkySceneCanvas
                  visibleObjects={visibleObjects}
                  showLabels={showLabels}
                  showConstellationLines={showConstellationLines}
                  onSelect={setSelected}
                />
              </Suspense>
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-slate-700/60 bg-slate-950/45 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 backdrop-blur-md">
                Drag to rotate · Scroll to zoom · Click a body to explore
              </div>
            </div>
          )}

          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
            Solar system motion is animated. Constellations and galaxies stay fixed for study.
          </p>
        </div>

        <aside
          className="border border-[rgba(100,160,255,0.28)] bg-[rgba(10,20,50,0.92)] p-4 text-slate-100 shadow-[0_22px_54px_rgba(4,10,24,0.5)] backdrop-blur-xl xl:sticky xl:top-28 xl:self-start"
          style={{ borderRadius: "14px" }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#5b9dff]">Selected Object</p>
          <h2 className="mt-1 text-[2rem] font-semibold text-white">Object Info</h2>
          {!selected && (
            <p className="mt-4 max-w-prose text-[13px] leading-[1.7] text-[#9ab4e8]">
              Start with the Sun, Jupiter, Orion, Sagittarius, Andromeda, and the Milky Way to
              get a quick overview of the night sky.
            </p>
          )}
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${selectedCategoryTone}`}>
                  {selected.category}
                </p>
                <h3 className="text-[22px] font-semibold text-white">{selected.name}</h3>
                <p className="max-w-prose text-[13px] leading-[1.65] text-[#9ab4e8]">
                  {selected.shortDescription}
                </p>
              </div>
              {selectedFactCards.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {selectedFactCards.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-4 border-t border-[rgba(100,160,255,0.15)] pt-2 text-[12px]"
                    >
                      <p className="text-[#5b9dff]">{item.label}</p>
                      <p className="text-right font-medium text-[#e0eaff]">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="max-w-prose text-[13px] leading-[1.65] text-[#9ab4e8]">{selected.details}</p>
              {selected.facts?.funFact && (
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/8 p-3 text-[13px] leading-[1.65] text-cyan-50">
                  <span className="mr-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    Fun fact
                  </span>
                  {selected.facts.funFact}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
