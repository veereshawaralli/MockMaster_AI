import { useEffect, useRef, useState } from "react";
import { listUsers, loginUser, registerUser } from "../api";
import { useUser } from "../context/UserContext";

// Full-screen auth gate. Renders children only once a session is active;
// otherwise it lets the user log in to an existing profile or create a new,
// password-protected one. The backend binds every request to the returned
// token, so one profile can't reach another's sessions or dashboard.
export default function ProfileGate({ children }) {
  const { user, login } = useUser();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [profiles, setProfiles] = useState([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef(null);

  useEffect(() => {
    if (user) return;
    let active = true;
    setLoading(true);
    listUsers()
      .then((list) => { if (active) setProfiles(list || []); })
      .catch(() => { if (active) setProfiles([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  if (user) return children;

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  // Tapping a known profile fills its name and jumps to the password field.
  const pickProfile = (p) => {
    setName(p.name);
    setError("");
    passwordRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !password) return;
    setBusy(true);
    setError("");
    try {
      const session =
        mode === "register"
          ? await registerUser(trimmed, password)
          : await loginUser(trimmed, password);
      login(session);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Something went wrong. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleBtn = (value, label) => (
    <button
      type="button"
      onClick={() => switchMode(value)}
      style={{
        flex: 1,
        padding: "9px 14px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: 600,
        background: mode === value ? "var(--accent-brand)" : "transparent",
        color: mode === value ? "var(--accent-ink)" : "var(--text-secondary)",
        transition: "background var(--transition-fast), color var(--transition-fast)",
      }}
    >
      {label}
    </button>
  );

  const canSubmit = name.trim() && password && !busy;

  return (
    <div className="profile-gate">
      <div className="profile-card">
        <h1 className="holo-text">
          {mode === "register" ? "Create your profile" : "Welcome back"}
        </h1>
        <p className="profile-sub">
          {mode === "register"
            ? "Choose a name and password. Your sessions and dashboard stay private to this profile."
            : "Log in to your profile. Each profile keeps its own sessions and dashboard."}
        </p>

        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            marginBottom: 22,
            background: "var(--bg-inset)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {toggleBtn("login", "Log in")}
          {toggleBtn("register", "Create account")}
        </div>

        {mode === "login" &&
          (loading ? (
            <div className="loading-spinner"></div>
          ) : profiles.length > 0 ? (
            <div className="profile-list">
              {profiles.map((p) => {
                const selected =
                  p.name.toLowerCase() === name.trim().toLowerCase();
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="profile-chip"
                    onClick={() => pickProfile(p)}
                    style={
                      selected
                        ? {
                            borderColor: "var(--accent-brand)",
                            background: "var(--accent-amber-bg)",
                            boxShadow: "var(--ring)",
                          }
                        : undefined
                    }
                  >
                    <span className="profile-avatar">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="profile-name">{p.name}</span>
                    <span className="profile-count">{p.session_count} sessions</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="profile-empty">
              No profiles yet — switch to <strong>Create account</strong> to make the first one.
            </p>
          ))}

        <form className="profile-form" onSubmit={handleSubmit}>
          <input
            className="profile-input"
            type="text"
            placeholder="Profile name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="username"
            autoFocus
          />
          <input
            id="pg-password"
            ref={passwordRef}
            className="profile-input"
            type="password"
            placeholder={
              mode === "register" ? "Create a password (min 4 chars)" : "Password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={128}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {busy
              ? mode === "register"
                ? "Creating…"
                : "Logging in…"
              : mode === "register"
              ? "Create profile"
              : "Log in"}
          </button>
        </form>
        {error && <p className="profile-error">{error}</p>}
      </div>
    </div>
  );
}
