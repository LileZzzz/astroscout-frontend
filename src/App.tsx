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
import { useAuth } from "./auth/AuthContext";
import astroScoutLogo from "./assets/logo.png";

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
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 bg-slate-900/45 backdrop-blur-xl">
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
              <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                AstroScout Beta
              </span>

              <div className="ml-auto flex items-center gap-3">
                {!isAuthenticated && (
                  <>
                    <NavLink to="/login" className="btn-ghost">
                      Log in
                    </NavLink>
                    <NavLink to="/register" className="btn-primary">
                      Create account
                    </NavLink>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    <span className="rounded-full border border-slate-600/80 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-200">
                      {user?.username}
                    </span>
                    <NavLink to="/profile" className="btn-ghost">
                      Profile
                    </NavLink>
                    <button type="button" onClick={logout} className="btn-ghost">
                      Log out
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="glass-panel-strong px-4 py-3 sm:px-5">
              <nav className="flex flex-wrap items-center justify-between gap-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `min-w-[6.5rem] text-center ${navBase} ${
                      isActive
                        ? "bg-cyan-300/15 text-cyan-200"
                        : "text-slate-200 hover:bg-slate-700/55 hover:text-white"
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/community"
                  className={({ isActive }) =>
                    `min-w-[6.5rem] text-center ${navBase} ${
                      isActive
                        ? "bg-cyan-300/15 text-cyan-200"
                        : "text-slate-200 hover:bg-slate-700/55 hover:text-white"
                    }`
                  }
                >
                  Community
                </NavLink>
                <NavLink
                  to="/plan"
                  className={({ isActive }) =>
                    `min-w-[6.5rem] text-center ${navBase} ${
                      isActive
                        ? "bg-cyan-300/15 text-cyan-200"
                        : "text-slate-200 hover:bg-slate-700/55 hover:text-white"
                    }`
                  }
                >
                  Planner
                </NavLink>
                <NavLink
                  to="/sky101"
                  className={({ isActive }) =>
                    `min-w-[6.5rem] text-center ${navBase} ${
                      isActive
                        ? "bg-cyan-300/15 text-cyan-200"
                        : "text-slate-200 hover:bg-slate-700/55 hover:text-white"
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

      <main className="content-wrap py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/community" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logs/new" element={<NewObservationPage />} />
          <Route path="/logs/:id/edit" element={<EditObservationPage />} />
          <Route path="/logs/:id" element={<LogDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/debug/score" element={<ObserveScoreDebugPage />} />
          <Route path="/plan" element={<ObservationPlannerPage />} />
          <Route path="/sky101" element={<Sky101Route />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
