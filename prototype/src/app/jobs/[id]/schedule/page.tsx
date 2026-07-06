// S7 — Scheduling (DB-backed, Chunk 1B). Generates a real appointment + link;
// ?done=1 shows the active link + paste-ready message (manual send in Phase 1).
import { StaffShell } from "@/components/Chrome";
import { durationForClaimType, getJob, getClient, jobTypeLabel, listAppointments } from "@/lib/data";
import { scheduleAction } from "@/lib/actions";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function Schedule({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  const job = getJob(id);
  if (!job) return <StaffShell title="Schedule"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;
  const client = getClient(job.client_id);
  const active = listAppointments(id).filter((a) => a.status === "scheduled" && !a.link_revoked_at).at(-1);
  const canSchedule = ["Assigned", "Scheduled", "No-show"].includes(job.status);

  const link = active ? `http://localhost:3000/c/${active.link_token}` : null;
  const msg = active
    ? job.job_type === "survey"
      ? `Hi ${client?.full_name}, your virtual risk survey (ref ${job.claim_number}) is booked for ${active.scheduled_start} with ${job.assessor_name ?? "your surveyor"}. Please open this link on your phone at that time: ${link} — we'll walk around the property together on video. No app needed.`
      : `Hi ${client?.full_name}, your virtual assessment for claim ${job.claim_number} is booked for ${active.scheduled_start} with ${job.assessor_name ?? "your assessor"}. Please open this link on your phone at that time: ${link} — you'll need access to the affected area. No app needed.`
    : "";

  const scheduleWithId = scheduleAction.bind(null, id);

  // Role-play-friendly defaults: today, ~30 min from now (links open 2h early,
  // so a link booked for "soon" is immediately usable in usability tests).
  const soon = new Date(Date.now() + 30 * 60 * 1000);
  const defDate = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, "0")}-${String(soon.getDate()).padStart(2, "0")}`;
  const defTime = `${String(soon.getHours()).padStart(2, "0")}:${String(soon.getMinutes()).padStart(2, "0")}`;

  return (
    <StaffShell title={`Schedule — ${job.job_number}`}>
      <div className="max-w-xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">
          {job.status === "No-show" ? `Reschedule (attempt ${job.attempt_count + 1})` : job.status === "Scheduled" ? "Reschedule appointment" : "Schedule appointment"}
        </h1>
        <p className="text-xs text-slate-500 mb-4">{client?.full_name} · {job.claim_number} · {job.status}</p>

        {canSchedule ? (
          <form action={scheduleWithId} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                <input name="date" type="date" required defaultValue={defDate} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Time (SAST)</label>
                <input name="time" type="time" required defaultValue={defTime} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Duration: {durationForClaimType(job.claim_type)} min ({jobTypeLabel(job)}).
              {job.status !== "Assigned" && " Rescheduling revokes the previous link and issues a new one."}
            </p>
            <button type="submit" className="mt-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-semibold">
              {job.status === "Assigned" ? "Book & generate client link" : "Rebook & reissue client link"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-4">
            Scheduling isn&apos;t available while this job is <b>{job.status}</b>.
          </p>
        )}

        {active && (
          <div className={`bg-white rounded-xl border p-4 mt-4 ${done ? "border-emerald-300" : "border-slate-200"}`}>
            <h2 className="text-sm font-semibold text-emerald-700">
              {done ? "Appointment booked — link active" : "Current active link"} (attempt {active.attempt_number})
            </h2>
            <code className="block bg-slate-100 rounded p-2 text-xs mt-2 break-all">{link}</code>
            <h3 className="text-xs font-medium text-slate-500 mt-3 mb-1">Paste-ready SMS / email text (manual send in Phase 1):</h3>
            <textarea readOnly className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-600 bg-slate-50" rows={4} defaultValue={msg} />
            <CopyButton text={msg} label="Copy message" />
          </div>
        )}
      </div>
    </StaffShell>
  );
}
