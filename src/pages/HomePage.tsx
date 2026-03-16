import { NavLink } from "react-router-dom";

function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-[0_10px_24px_rgba(245,166,35,0.12)]">
      {children}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

function SkyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
    </svg>
  );
}

export function HomePage() {
  return (
    <section className="mx-auto w-full max-w-[92rem]">
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <header className="glass-panel-strong panel-elevated panel-pad-xl overflow-hidden">
            <p className="section-eyebrow">AstroScout</p>
            <h1 className="section-title-xl max-w-3xl">
              Plan better observation nights and learn from the astronomy community.
            </h1>
            <p className="section-copy max-w-2xl">
              AstroScout combines practical observation planning with AI guidance. Use a
              location and date to estimate sky quality, then move to community logs to
              explore how other users captured their sessions.
            </p>
          </header>

          <article className="glass-panel panel-elevated card-polish panel-pad">
            <p className="section-eyebrow">Community</p>
            <div className="mt-2 flex items-center gap-3">
              <CardIcon>
                <CommunityIcon />
              </CardIcon>
              <h2 className="section-title-lg mt-0">Share and explore logs</h2>
            </div>
            <p className="section-copy-sm">
              Open the Community section to read public observation logs, review likes
              and comments, and publish a new log from your own session.
            </p>
            <div className="mt-4">
              <NavLink to="/community" className="btn-ghost">
                Go to Community
              </NavLink>
            </div>
          </article>

          <article className="glass-panel panel-elevated card-polish panel-pad">
            <p className="section-eyebrow">Planner</p>
            <div className="mt-2 flex items-center gap-3">
              <CardIcon>
                <CalendarIcon />
              </CardIcon>
              <h2 className="section-title-lg mt-0">Plan and ask AI</h2>
            </div>
            <p className="section-copy-sm">
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

          <article className="glass-panel panel-elevated card-polish panel-pad">
            <p className="section-eyebrow">Sky101</p>
            <div className="mt-2 flex items-center gap-3">
              <CardIcon>
                <SkyIcon />
              </CardIcon>
              <h2 className="section-title-lg mt-0">Learn the sky visually</h2>
            </div>
            <p className="section-copy-sm">
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
          <article className="glass-panel panel-elevated card-polish overflow-hidden p-0">
            <div>
              <img
                src="https://images-assets.nasa.gov/image/PIA25434/PIA25434~medium.jpg"
                alt="NASA Orion Nebula in infrared"
                loading="lazy"
                className="h-[24rem] w-full bg-slate-950 object-cover xl:h-[25rem]"
              />
            </div>
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

          <article className="glass-panel panel-elevated card-polish overflow-hidden p-0">
            <div>
              <img
                src="https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~medium.jpg"
                alt="NASA James Webb Carina Nebula Cosmic Cliffs"
                loading="lazy"
                className="h-[24rem] w-full bg-slate-950 object-cover xl:h-[25rem]"
              />
            </div>
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
