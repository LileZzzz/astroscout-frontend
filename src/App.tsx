import { Routes, Route, Link } from "react-router-dom";
import { FeedPage } from "./pages/FeedPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuth } from "./auth/AuthContext";

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold">
          AstroScout
        </Link>
        <nav className="space-x-4 text-sm">
          {!isAuthenticated && (
            <>
              <Link to="/login" className="hover:text-sky-400">
                Login
              </Link>
              <Link to="/register" className="hover:text-sky-400">
                Register
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <span className="text-slate-300">
                {user?.username ?? user?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:border-sky-500"
              >
                Logout
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
