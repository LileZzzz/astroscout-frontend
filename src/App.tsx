import { Suspense, lazy } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { FeedPage } from "./pages/FeedPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NewObservationPage } from "./pages/NewObservationPage";
import { LogDetailPage } from "./pages/LogDetailPage";
import { EditObservationPage } from "./pages/EditObservationPage";
import { ObserveScoreDebugPage } from "./pages/ObserveScoreDebugPage";
import { ObservationPlannerPage } from "./pages/ObservationPlannerPage.tsx";
import { ProfilePage } from "./pages/ProfilePage";
import { ChatPage } from "./pages/ChatPage";
import { useAuth } from "./auth/AuthContext";
import astroScoutLogo from "./assets/logo.png";
import { ParticleBackground } from "./components/ParticleBackground.tsx";

const Sky101Page = lazy(() =>
  import("./pages/Sky101Page.tsx").then((module) => ({ default: module.Sky101Page }))
);

function Sky101Route() {
  return (
    <Suspense
      fallback={
        <section className="glass-panel p-6 text-sm text-slate-300">
          Loading Sky101 classroom...
        </section>
      }
    >
      <Sky101Page />
    </Suspense>
  );
}

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  const navBase =
    "min-w-[6.5rem] rounded-full px-3 py-1.5 text-center text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0";

  return (
    <div className="app-shell">
      <ParticleBackground />

      <header className="sticky top-0 z-20 border-b border-slate-700/40 bg-slate-950/35 backdrop-blur-xl">
        <div className="pointer-events-none absolute left-2 top-2 z-30 sm:left-4 sm:top-3">
          <div className="pointer-events-auto flex flex-col items-start gap-2">
            <NavLink
              to="/"
              className="inline-flex w-fit items-center rounded-[1.5rem] bg-slate-950/5 px-1.5 py-1 shadow-[0_14px_28px_rgba(15,23,42,0.16)] transition hover:bg-slate-950/12"
            >
              <img
                src={astroScoutLogo}
                alt="AstroScout"
                className="brand-mark h-[5.8rem] w-auto max-w-[22rem] object-contain sm:h-[6.6rem]"
              />
            </NavLink>
          </div>
        </div>

        <div className="content-wrap py-4 pt-28 sm:pt-32 lg:pt-4">
          <div className="grid gap-3 lg:grid-rows-[auto_auto]">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-gradient text-sm font-semibold tracking-[0.08em]">
                AstroScout Beta
              </span>

              <div className="ml-auto flex items-center gap-3">
                {!isAuthenticated && (
                  <NavLink to="/login" className="btn-ghost">
                    Log in
                  </NavLink>
                )}
                {isAuthenticated && (
                  <div className="group relative">
                    <button
                      type="button"
                      className="btn-ghost data-[open=true]:border-amber-300/50 data-[open=true]:text-white"
                    >
                      {user?.username}
                    </button>

                    <div className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-44 translate-y-1 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="glass-panel-strong panel-elevated p-2">
                        <NavLink
                          to="/profile"
                          className="block rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700/45 hover:text-white"
                        >
                          Profile
                        </NavLink>
                        <button
                          type="button"
                          onClick={logout}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-700/45 hover:text-white"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel-strong glow-primary px-4 py-3 sm:px-5">
              <nav className="flex flex-wrap items-center justify-between gap-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `${navBase} ${
                      isActive
                        ? "bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_22px_rgba(47,184,255,0.14)]"
                        : "text-slate-200 hover:bg-slate-700/45 hover:text-white"
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/community"
                  className={({ isActive }) =>
                    `${navBase} ${
                      isActive
                        ? "bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_22px_rgba(47,184,255,0.14)]"
                        : "text-slate-200 hover:bg-slate-700/45 hover:text-white"
                    }`
                  }
                >
                  Community
                </NavLink>
                <NavLink
                  to="/plan"
                  className={({ isActive }) =>
                    `${navBase} ${
                      isActive
                        ? "bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_22px_rgba(47,184,255,0.14)]"
                        : "text-slate-200 hover:bg-slate-700/45 hover:text-white"
                    }`
                  }
                >
                  Planner
                </NavLink>
                <NavLink
                  to="/sky101"
                  className={({ isActive }) =>
                    `${navBase} ${
                      isActive
                        ? "bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_22px_rgba(47,184,255,0.14)]"
                        : "text-slate-200 hover:bg-slate-700/45 hover:text-white"
                    }`
                  }
                >
                  Sky101
                </NavLink>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="content-wrap relative z-10 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/community" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logs/new" element={<NewObservationPage />} />
          <Route path="/logs/:id/edit" element={<EditObservationPage />} />
          <Route path="/logs/:id" element={<LogDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assistant" element={<ChatPage />} />
          <Route path="/debug/score" element={<ObserveScoreDebugPage />} />
          <Route path="/plan" element={<ObservationPlannerPage />} />
          <Route path="/sky101" element={<Sky101Route />} />
        </Routes>
      </main>

      <div className="pointer-events-none fixed bottom-4 right-4 z-30 rounded-full bg-slate-950/50 px-3 py-1.5 text-xs tracking-[0.04em] text-slate-300 backdrop-blur-md">
        Author: Lilez (Larry)
      </div>
    </div>
  );
}

export default App;
