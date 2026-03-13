import { NavLink } from "react-router-dom";

export function HomePage() {
  return (
    <section className="mx-auto w-full max-w-[92rem]">
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <header className="glass-panel-strong overflow-hidden p-6 sm:p-8">
            <p className="label-muted">AstroScout</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
              Plan better observation nights and learn from the astronomy community.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
              AstroScout combines practical observation planning with AI guidance. Use a
              location and date to estimate sky quality, then move to community logs to
              explore how other users captured their sessions.
            </p>
          </header>

          <article className="glass-panel p-5">
            <p className="label-muted">Community</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Share and explore logs</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Open the Community section to read public observation logs, review likes
              and comments, and publish a new log from your own session.
            </p>
            <div className="mt-4">
              <NavLink to="/community" className="btn-ghost">
                Go to Community
              </NavLink>
            </div>
          </article>

          <article className="glass-panel p-5">
            <p className="label-muted">Planner</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Plan and ask AI</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              In Planner, calculate observing score and ask the AI assistant for
              recommendations based on your selected date, coordinates, weather summary,
              moon phase, and light pollution.
            </p>
            <div className="mt-4">
              <NavLink to="/plan" className="btn-ghost">
                Go to Planner
              </NavLink>
            </div>
          </article>

          <article className="glass-panel p-5">
            <p className="label-muted">Sky101</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Learn the sky visually</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Use the interactive Sky101 map to explore planets, constellations, and galaxies,
              then open object info cards for quick science facts.
            </p>
            <div className="mt-4">
              <NavLink to="/sky101" className="btn-ghost">
                Open Sky101
              </NavLink>
            </div>
          </article>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:sticky xl:top-28">
          <article className="glass-panel overflow-hidden p-0">
            <img
              src="https://images-assets.nasa.gov/image/PIA25434/PIA25434~medium.jpg"
              alt="NASA Orion Nebula in infrared"
              loading="lazy"
              className="h-[24rem] w-full bg-slate-950 object-cover xl:h-[25rem]"
            />
            <div className="p-4 sm:p-5">
              <p className="text-xs text-slate-400">
                NASA image source: Orion Nebula in Infrared (PIA25434)
              </p>
              <a
                href="https://images.nasa.gov/details-PIA25434"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-cyan-200 hover:text-cyan-100"
              >
                View source page
              </a>
            </div>
          </article>

          <article className="glass-panel overflow-hidden p-0">
            <img
              src="https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~medium.jpg"
              alt="NASA James Webb Carina Nebula Cosmic Cliffs"
              loading="lazy"
              className="h-[24rem] w-full bg-slate-950 object-cover xl:h-[25rem]"
            />
            <div className="p-4 sm:p-5">
              <p className="text-xs text-slate-400">
                NASA image source: Carina Nebula Cosmic Cliffs (carina_nebula)
              </p>
              <a
                href="https://images.nasa.gov/details/carina_nebula"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-cyan-200 hover:text-cyan-100"
              >
                View source page
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
