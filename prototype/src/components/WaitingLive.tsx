"use client";
// Waiting-room presence + admit listener (Chunk 1D). Polls the room channel as
// the "waiting" peer; when the assessor admits, the client moves into the room.
//
// Mechanics unchanged. The UX pass replaced the invisible/endless-spinner state
// with calm, low-motion status: what has already been done, that the assessor
// has been told, whether we can still reach the service, and what to do if the
// wait becomes unusually long. The internal readiness event system is never
// exposed.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ClientCard } from "@/components/ui/client";
import { LiveRegion } from "@/components/ui/Overlay";

const LONG_WAIT_SECONDS = 180;

export function WaitingLive({
  token, jobId, assessorName,
}: { token: string; jobId: string; assessorName: string }) {
  const router = useRouter();
  const [reachable, setReachable] = useState(true);
  const [waited, setWaited] = useState(0);
  const [admitting, setAdmitting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setWaited((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let stop = false;
    let misses = 0;
    const poll = async () => {
      if (stop) return;
      try {
        const res = await fetch(`/api/rtc/job-${jobId}?peer=waiting`, { cache: "no-store" });
        const data = await res.json();
        misses = 0;
        setReachable(true);
        for (const m of data.messages ?? []) {
          if (m.type === "app" && m.payload?.type === "banner" && m.payload?.text === "__ADMIT__") {
            stop = true;
            setAdmitting(true);
            router.push(`/c/${token}/session${window.location.search}`);
            return;
          }
        }
      } catch {
        misses += 1;
        if (misses >= 3) setReachable(false);
      }
      setTimeout(poll, 1500);
    };
    void poll();
    return () => { stop = true; };
  }, [token, jobId, router]);

  const longWait = waited >= LONG_WAIT_SECONDS;

  return (
    <>
      <ClientCard tone={reachable ? "accent" : "warning"} className="mt-4">
        <div className="flex items-start gap-3">
          <span className="relative mt-1 flex h-3 w-3 shrink-0" aria-hidden>
            <span className={`absolute inline-flex h-3 w-3 rounded-full ${reachable ? "bg-accent" : "bg-status-warning"}`} />
            {reachable && (
              <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-accent opacity-60" style={{ animationDuration: "2.4s" }} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground">
              {admitting
                ? "Connecting you now…"
                : reachable
                  ? "Connected and waiting"
                  : "We’ve lost your connection"}
            </p>
            <p className="mt-1 text-base leading-relaxed text-muted">
              {admitting
                ? `${assessorName} has let you in.`
                : reachable
                  ? `${assessorName} has been told you’re here. You’ll be connected automatically — you don’t need to tap anything.`
                  : "Check your signal or Wi-Fi. Stay on this page; we’ll keep trying to reconnect you."}
            </p>
          </div>
        </div>
      </ClientCard>

      {longWait && reachable && !admitting && (
        <ClientCard tone="plain" className="mt-3" icon="clock" title="Still waiting?">
          <p className="text-base leading-relaxed text-muted">
            Assessments sometimes run a few minutes over, so a short wait is
            normal. Please keep this page open. If you’ve been waiting more than
            ten minutes, phone the number on the SMS we sent you and we’ll sort it
            out.
          </p>
        </ClientCard>
      )}

      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
        <Icon name="camera" size={15} className="mt-0.5 shrink-0" />
        Keep your phone unlocked and this page open — your camera and microphone
        will be needed as soon as you’re let in.
      </p>

      <LiveRegion
        message={
          admitting ? `${assessorName} has let you in — connecting now`
          : !reachable ? "Connection lost. Stay on this page; we are trying to reconnect."
          : ""
        }
      />
    </>
  );
}
