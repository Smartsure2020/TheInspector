"use client";
// Placeholder access ONLY (phase1/01). No authentication exists or may be added
// in Phase 1 — role + demo user persist in localStorage AND a plain cookie so
// server actions can attribute events. This is mock access by design (AC9).
import { createContext, useContext, useEffect, useState } from "react";

export interface DemoUserLite { id: string; name: string; role: string; title: string }

interface RoleState {
  user: DemoUserLite | null;
  setUser: (u: DemoUserLite | null) => void;
  ready: boolean;
}

const Ctx = createContext<RoleState>({ user: null, setUser: () => {}, ready: false });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<DemoUserLite | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("inspector.demoUserObj");
    if (raw) try { setUserState(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, []);

  const setUser = (u: DemoUserLite | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("inspector.demoUserObj", JSON.stringify(u));
      document.cookie = `inspector.demoUser=${u.id}; path=/; SameSite=Lax`;
    } else {
      localStorage.removeItem("inspector.demoUserObj");
      document.cookie = "inspector.demoUser=; path=/; Max-Age=0";
    }
  };

  return <Ctx.Provider value={{ user, setUser, ready }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
