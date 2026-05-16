import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Interview from "./pages/Interview";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="icon">🎤</span>
          <span>MockMaster AI</span>
        </NavLink>
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
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
