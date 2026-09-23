import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import { UserProvider, useUser } from "./context/UserContext";
import ProfileGate from "./components/ProfileGate";

// Code-split the heavy routes so the landing page ships a smaller initial bundle.
// Dashboard pulls in Recharts + jsPDF + html2canvas; Interview pulls in the audio
// analysis stack. Neither is needed for first paint on "/".
const Interview = lazy(() => import("./pages/Interview"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Create Theme Context
export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Navbar badge for the active profile, with a "switch profile" escape hatch.
function ProfileChip() {
  const { user, logout } = useUser();
  if (!user) return null;
  return (
    <div className="profile-badge">
      <span className="profile-badge-avatar">{user.name.charAt(0).toUpperCase()}</span>
      <span className="profile-badge-name">{user.name}</span>
      <button className="profile-switch-btn" onClick={logout} title="Log out">
        Log out
      </button>
    </div>
  );
}

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="icon icon-float">🎤</span>
          <span className="holo-text">MockMaster AI</span>
        </NavLink>

        <div className="navbar-right">
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Home
            </NavLink>
            <NavLink to="/interview" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              🎙️ Interview
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              📊 Dashboard
            </NavLink>
          </div>

          <ProfileChip />

          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn cyber-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* Dynamic Background */}
      <div className="cyber-bg">
        <div className="cyber-grid"></div>
        <div className="cyber-glow"></div>
      </div>

      {/* Routes */}
      <Suspense
        fallback={
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading…</p>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return savedTheme ? savedTheme : "dark";
  });

  // Apply theme class to body whenever it changes
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <UserProvider>
        <BrowserRouter>
          <ProfileGate>
            <AppShell />
          </ProfileGate>
        </BrowserRouter>
      </UserProvider>
    </ThemeContext.Provider>
  );
}
