"use client";
// Waiting-room presence + admit listener (Chunk 1D). Polls the room channel as
// the "waiting" peer; when the assessor admits, moves the client into the room.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function WaitingLive({ token, jobId }: { token: string; jobId: string }) {
  const router = useRouter();
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      if (stop) return;
      try {
        const res = await fetch(`/api/rtc/job-${jobId}?peer=waiting`, { cache: "no-store" });
        const data = await res.json();
        for (const m of data.messages ?? []) {
          if (m.type === "app" && m.payload?.type === "banner" && m.payload?.text === "__ADMIT__") {
            stop = true;
            router.push(`/c/${token}/session${window.location.search}`);
            return;
          }
        }
      } catch { /* keep waiting */ }
      setTimeout(poll, 1500);
    };
    void poll();
    return () => { stop = true; };
  }, [token, jobId, router]);
  return null;
}
