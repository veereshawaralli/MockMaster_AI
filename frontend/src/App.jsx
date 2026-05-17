import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Interview from "./pages/Interview";
import Dashboard from "./pages/Dashboard";

// Create Theme Context
export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

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
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <BrowserRouter>
        {/* Navbar */}
        <nav className="navbar">
          <NavLink to="/" className="navbar-brand">
            <span className="icon 3d-float">🎤</span>
            <span className="holo-text">MockMaster AI</span>
          </NavLink>
          
          <div className="navbar-right">
            <div className="navbar-links">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Home
              </NavLink>
              <NavLink
                to="/interview"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                🎙️ Interview
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                📊 Dashboard
              </NavLink>
            </div>
            
            {/* Theme Toggle Button */}
            <button 
              className="theme-toggle-btn cyber-btn" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

        {/* Dynamic Background */}
        <div className="cyber-bg">
          <div className="cyber-grid"></div>
          <div className="cyber-glow"></div>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
