import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=guest, obj=user
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("qiveo_token");
    if (!token) { setUser(false); setReady(true); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem("qiveo_token"); setUser(false); })
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("qiveo_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("qiveo_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const demo = async (provider) => {
    const { data } = await api.post("/auth/demo", { provider });
    localStorage.setItem("qiveo_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("qiveo_token");
    setUser(false);
  };

  const refresh = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, demo, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

const STAFF = ["super_admin", "ts_moderator", "content_reviewer", "support_agent", "auditor"];
export const isStaff = (u) => u && STAFF.includes(u.role);
