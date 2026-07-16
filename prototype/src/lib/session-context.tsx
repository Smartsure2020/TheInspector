"use client";
import { createContext, useContext } from "react";
import type { SessionUser } from "./auth";

const Ctx = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useSession(): SessionUser {
  const user = useContext(Ctx);
  if (!user) throw new Error("useSession called outside SessionProvider");
  return user;
}
