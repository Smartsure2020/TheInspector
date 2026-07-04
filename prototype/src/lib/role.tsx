"use client";
// Placeholder access ONLY (phase1/01). No authentication exists or may be added
// in Phase 1 — role + demo user persist in localStorage per browser. AC9 guard.
import { createContext, useContext, useEffect, useState } from "react";
import { DemoUser } from "./types";
import { users } from "./fixtures";

interface RoleState {
  user: DemoUser | null;
  setUser: (u: DemoUser | null) => void;
  ready: boolean;
}

const Ctx = createContext<RoleState>({ user: null, setUser: () => {}, ready: false });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("inspector.demoUser");
    if (id) setUserState(users.find((u) => u.id === id) ?? null);
    setReady(true);
  }, []);

  const setUser = (u: DemoUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem("inspector.demoUser", u.id);
    else localStorage.removeItem("inspector.demoUser");
  };

  return <Ctx.Provider value={{ user, setUser, ready }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
