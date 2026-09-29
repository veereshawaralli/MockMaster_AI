import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  adminGetUsers,
  adminGetStats,
  adminGetUserSessions,
  adminResetPassword,
  adminDeleteUser,
} from "../api";

// Admin console: view every profile, inspect a user's sessions, reset a
// password, or delete a profile. Every call is gated server-side (403 for
// non-admins); this page also hides itself from non-admins as a courtesy.
export default function Admin() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");

  // modal = { user, mode: "view" | "reset" } | null
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  const isAdmin = !!user?.is_admin;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, s] = await Promise.all([adminGetUsers(), adminGetStats()]);
      setUsers(u.users || []);
      setStats(s);
    } catch (err) {
      setError(err?.response?.status === 403 ? "forbidden" : "load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

  const openView = async (u) => {
    setModal({ user: u, mode: "view" });
    setDetail(null);
    setModalError("");
    try {
      setBusy(true);
      const data = await adminGetUserSessions(u.id);
      setDetail(data);
    } catch {
      setModalError("Couldn't load this user's sessions.");
    } finally {
      setBusy(false);
    }
  };

  const openReset = (u) => {
    setModal({ user: u, mode: "reset" });
    setPassword("");
    setModalError("");
  };

  const closeModal = () => {
    setModal(null);
    setDetail(null);
    setPassword("");
    setModalError("");
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (password.length < 4) {
      setModalError("Password must be at least 4 characters.");
      return;
    }
    try {
      setBusy(true);
      const name = modal.user.name;
      await adminResetPassword(modal.user.id, password);
      closeModal();
      setNotice(`Password reset for ${name}. They've been signed out.`);
    } catch (err) {
      setModalError(err?.response?.data?.detail || "Couldn't reset the password.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name} and all their sessions? This can't be undone.`)) return;
    try {
      setNotice("");
      await adminDeleteUser(u.id);
      setNotice(`Deleted ${u.name}.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || "delete");
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="icon icon-float">🛡️</div>
          <p style={{ color: "var(--text-secondary)" }}>
            This area is for administrators only.
          </p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: "60vh" }}>
        <div className="loading-spinner"></div>
        <p>Loading admin console…</p>
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="icon icon-float">🛡️</div>
          <p style={{ color: "var(--text-secondary)" }}>
            Your account no longer has admin access.
          </p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const errorMsg =
    error === "load"
      ? "Failed to load admin data. Is the backend running?"
      : error === "delete"
      ? "Couldn't delete that user."
      : error && error !== "forbidden"
      ? error
      : "";

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Administration</h1>
        <p className="page-subtitle" style={{ color: "var(--text-secondary)" }}>
          Manage every profile on MockMaster AI
        </p>
      </div>

      {notice && <div className="admin-banner admin-banner-ok">{notice}</div>}
      {errorMsg && <div className="admin-banner admin-banner-err">{errorMsg}</div>}

      {stats && (
        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card stat-blue">
            <div className="stat-value">{stats.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-value">{stats.total_admins}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card stat-cyan">
            <div className="stat-value">{stats.total_sessions}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Sessions</th>
              <th>Joined</th>
              <th className="admin-actions-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-avatar">{u.name.charAt(0).toUpperCase()}</span>
                    <span className="admin-user-name">{u.name}</span>
                    {u.is_admin && <span className="badge badge-purple">Admin</span>}
                    {u.id === user.id && <span className="badge badge-cyan">You</span>}
                  </div>
                </td>
                <td>{u.session_count}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                <td>
                  <div className="admin-row-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openView(u)}>View</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openReset(u)}>Reset</button>
                    <button
                      className="btn btn-sm admin-btn-danger"
                      onClick={() => handleDelete(u)}
                      disabled={u.id === user.id}
                      title={u.id === user.id ? "You can't delete your own account" : "Delete user"}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>{modal.mode === "reset" ? "Reset password" : modal.user.name}</h2>
              <button className="admin-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>
            {modal.mode === "reset" ? (
              <form className="profile-form" onSubmit={submitReset}>
                <p className="admin-modal-sub">
                  Set a new password for <strong>{modal.user.name}</strong>. Their active
                  sessions will be signed out immediately.
                </p>
                <input
                  className="profile-input"
                  type="password"
                  placeholder="New password (min 4 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={128}
                  autoFocus
                  autoComplete="new-password"
                />
                <button type="submit" className="btn btn-primary" disabled={busy || password.length < 4}>
                  {busy ? "Saving…" : "Reset password"}
                </button>
                {modalError && <p className="profile-error">{modalError}</p>}
              </form>
            ) : (
              <div className="admin-view-body">
                {busy && <p className="admin-modal-sub">Loading sessions…</p>}
                {modalError && <p className="profile-error">{modalError}</p>}
                {detail && (
                  <>
                    <div className="admin-mini-stats">
                      <div className="admin-mini">
                        <span className="admin-mini-value">{detail.sessions.length}</span>
                        <span className="admin-mini-label">Sessions</span>
                      </div>
                      <div className="admin-mini">
                        <span className="admin-mini-value">{detail.user.is_admin ? "Admin" : "User"}</span>
                        <span className="admin-mini-label">Role</span>
                      </div>
                      <div className="admin-mini">
                        <span className="admin-mini-value">
                          {detail.user.created_at ? new Date(detail.user.created_at).toLocaleDateString() : "—"}
                        </span>
                        <span className="admin-mini-label">Joined</span>
                      </div>
                    </div>
                    {detail.sessions.length === 0 ? (
                      <p className="admin-modal-sub" style={{ marginTop: "1rem" }}>No sessions yet.</p>
                    ) : (
                      <div className="admin-session-list">
                        {detail.sessions.map((s) => (
                          <div key={s.id} className="admin-session-row">
                            <div>
                              <div className="admin-session-topic">{s.topic}</div>
                              <div className="admin-session-meta">
                                {s.total_questions} questions · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                              </div>
                            </div>
                            <span className="badge badge-cyan">{s.difficulty}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
