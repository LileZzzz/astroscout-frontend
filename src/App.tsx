import { Routes, Route, Link } from "react-router-dom";
import { FeedPage } from "./pages/FeedPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NewObservationPage } from "./pages/NewObservationPage";
import { LogDetailPage } from "./pages/LogDetailPage";
import { EditObservationPage } from "./pages/EditObservationPage";
import { ObserveScoreDebugPage } from "./pages/ObserveScoreDebugPage";
import { useAuth } from "./auth/AuthContext";

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-black/90 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            AstroScout
          </Link>
          {isAuthenticated && (
            <Link
              to="/logs/new"
              className="text-sm text-sky-400 hover:text-sky-300"
            >
              New log
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {!isAuthenticated && (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white">
                Log in
              </Link>
              <Link to="/register" className="rounded-full bg-white text-black px-4 py-1.5 font-semibold hover:bg-slate-200">
                Sign up
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <span className="text-slate-400 text-sm">
                {user?.username ?? user?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-slate-400 hover:text-white text-sm"
              >
                Log out
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logs/new" element={<NewObservationPage />} />
          <Route path="/logs/:id/edit" element={<EditObservationPage />} />
          <Route path="/logs/:id" element={<LogDetailPage />} />
          <Route path="/debug/score" element={<ObserveScoreDebugPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
