import { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken, getMe, logoutUser } from "../api";

const STORAGE_KEY = "mockmaster-profile";
const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  // Restore the last-used session so a refresh doesn't force a re-login. A
  // stored profile without a token predates password auth — ignore it so the
  // gate asks for a password instead of leaving every request unauthenticated.
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.token) {
        setAuthToken(parsed.token);
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Validate a restored token once on load; drop the session if it's stale,
  // and refresh the admin flag so a promotion/demotion (driven by server env)
  // is reflected on the next load without forcing a re-login.
  useEffect(() => {
    if (!user || !user.token) return;
    let active = true;
    getMe()
      .then((me) => {
        if (!active || !me) return;
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, name: me.name, is_admin: !!me.is_admin };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      })
      .catch((err) => {
        if (active && err?.response?.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          setAuthToken(null);
          setUser(null);
        }
      });
    return () => {
      active = false;
    };
    // Runs once on mount to check the persisted token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // session = { token, user: { id, name, is_admin } } returned by login/register.
  const login = (session) => {
    const next = {
      id: session.user.id,
      name: session.user.name,
      is_admin: !!session.user.is_admin,
      token: session.token,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuthToken(next.token);
    setUser(next);
  };

  const logout = () => {
    logoutUser().catch(() => {}); // best-effort server-side token invalidation
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
