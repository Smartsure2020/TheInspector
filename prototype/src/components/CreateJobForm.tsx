"use client";
// Create job — claims and surveys, governed template picker.
//
// Behaviour preserved exactly: the same field names post to the same
// `createJobAction`, fire remains a disabled option in the picker AND is still
// rejected server-side. The wrapper below only surfaces that rejection as a
// readable message instead of an unhandled error.
import { useActionState, useState } from "react";
import { createJobAction } from "@/lib/actions";
import { TemplateSection } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, Button, DetailList, FieldGroup, FormField, InlineAlert, JobTypeBadge, PageHeader,
} from "@/components/ui/primitives";

interface Tpl {
  id: string; name: string; version: string; job_type: string;
  is_reference_only: number; is_limited: number; sections: TemplateSection[];
}
interface Assessor { id: string; name: string }

export function CreateJobForm({ templates, assessors, mandates }: {
  templates: Tpl[]; assessors: Assessor[]; mandates: Record<string, string[]>;
}) {
  const [templateId, setTemplateId] = useState(templates.find((t) => !t.is_reference_only)?.id ?? "");
  const tpl = templates.find((t) => t.id === templateId);
  const isSurvey = tpl?.job_type === "survey";
  const claims = templates.filter((t) => t.job_type === "assessment");
  const surveys = templates.filter((t) => t.job_type === "survey");
  const eligible = assessors.filter((a) => mandates[a.id]?.includes(templateId));

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await createJobAction(formData);
        return null;
      } catch (x) {
        // A successful create redirects; Next signals that by throwing.
        const digest = (x as { digest?: string })?.digest ?? "";
        if (digest.startsWith("NEXT_REDIRECT") || (x instanceof Error && x.message.includes("NEXT_REDIRECT"))) throw x;
        return { error: x instanceof Error ? x.message : "The job could not be created." };
      }
    },
    null,
  );

  const items = tpl?.sections.flatMap((s) => s.items) ?? [];
  const evidenceCount = items.filter((i) => i.evidenceRequired).length;
  const hiResCount = items.filter((i) => i.highRes).length;
  const guidedCount = items.filter((i) => i.clientInstruction).length;

  const option = (t: Tpl) => (
    <option key={t.id} value={t.id} disabled={!!t.is_reference_only}>
      {t.name}
      {t.is_reference_only ? " — not bookable (physical-first)" : t.is_limited ? " — limited / prototype depth" : ""}
    </option>
  );

  return (
    <form action={formAction} className="max-w-5xl">
      <PageHeader
        trail={[{ label: "Pipeline", href: "/admin" }, { label: "New job" }]}
        title={isSurvey ? "New risk survey" : "New claim assessment"}
        lede="Six short groups: who the client is, what kind of job it is, the reference details, what happened, who does it, and how urgent it is."
        meta={<JobTypeBadge jobType={tpl?.job_type ?? "assessment"} />}
      />

      {state?.error && (
        <InlineAlert tone="danger" role="alert" className="mb-5" title="This job wasn’t created">
          {state.error}
        </InlineAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {/* ---- 1. Client -------------------------------------------------- */}
          <FieldGroup
            legend="1 · Client"
            hint="Role-play data only. Never enter a real name, number or address in this build."
          >
            <div className="space-y-4">
              <FormField id="client_name" label="Full name" required hint="As it should read on the report and the client’s SMS.">
                <input id="client_name" name="client_name" required autoComplete="off" className="w-full" placeholder="Test Insured 19" />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="client_phone" label="Mobile number" hint="Where the appointment link will be sent by hand.">
                  <input id="client_phone" name="client_phone" type="tel" inputMode="tel" autoComplete="off" className="w-full" placeholder="082 555 0119" />
                </FormField>
                <FormField id="client_email" label="Email">
                  <input id="client_email" name="client_email" type="email" autoComplete="off" className="w-full" placeholder="test19@example.invalid" />
                </FormField>
              </div>
            </div>
          </FieldGroup>

          {/* ---- 2. Type ---------------------------------------------------- */}
          <FieldGroup
            legend="2 · Assessment or survey type"
            hint="The template decides the checklist, the evidence requirements and the report structure. Preview it on the right."
          >
            <FormField
              id="template_id"
              label="Template"
              required
              hint="Greyed-out options are reference-only: they route to a physical inspection and cannot be booked as a virtual job."
            >
              <select
                id="template_id"
                name="template_id"
                className="w-full"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <optgroup label="Claim assessments">{claims.map(option)}</optgroup>
                <optgroup label="Risk surveys">{surveys.map(option)}</optgroup>
              </select>
            </FormField>
          </FieldGroup>

          {/* ---- 3. Reference ---------------------------------------------- */}
          <FieldGroup legend={isSurvey ? "3 · Survey reference" : "3 · Claim reference"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="claim_number" label={isSurvey ? "Reference number" : "Claim number"} required>
                <input id="claim_number" name="claim_number" required autoComplete="off" className="w-full font-mono" placeholder={isSurvey ? "REF-77005" : "CLM-88119"} />
              </FormField>
              <FormField id="policy_number" label="Policy number">
                <input id="policy_number" name="policy_number" autoComplete="off" className="w-full font-mono" placeholder="POL-0000" />
              </FormField>
            </div>
          </FieldGroup>

          {/* ---- 4. What happened ------------------------------------------ */}
          <FieldGroup legend={isSurvey ? "4 · Survey brief" : "4 · Loss information"}>
            <div className="space-y-4">
              <FormField
                id="date_of_loss"
                label={isSurvey ? "Requested survey date" : "Date of loss"}
                hint={isSurvey ? "When the underwriter wants the survey done by." : "The date the damage happened, not the date it was reported."}
              >
                <input id="date_of_loss" name="date_of_loss" type="date" className="w-full" />
              </FormField>
              <FormField
                id="description"
                label={isSurvey ? "Survey instructions / risk description" : "Loss description"}
                hint="What the assessor should expect to find. Two or three sentences is enough."
              >
                <textarea id="description" name="description" className="w-full" rows={3} />
              </FormField>
              <FormField
                id="special_conditions"
                label={isSurvey ? "Special focus areas" : "Special conditions to verify"}
                hint={isSurvey
                  ? "Underwriter concerns the surveyor must address. Shown as a warning on the job."
                  : "Policy warranties the assessor must check. Shown as a warning on the job."}
              >
                <textarea
                  id="special_conditions"
                  name="special_conditions"
                  className="w-full"
                  rows={2}
                  placeholder={isSurvey ? "e.g. confirm thatch separation distance and lightning protection" : "e.g. confirm the alarm was armed and linked"}
                />
              </FormField>
            </div>
          </FieldGroup>

          {/* ---- 5 & 6. Assignment and priority ---------------------------- */}
          <FieldGroup
            legend="5 · Assignment and priority"
            hint="Only assessors with a mandate for this template can be selected. You can assign later."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="assessor_id"
                label={isSurvey ? "Surveyor" : "Assessor"}
                hint={eligible.length === 0 ? undefined : `${eligible.length} mandated for this template`}
              >
                <select id="assessor_id" name="assessor_id" className="w-full" defaultValue="">
                  <option value="">Assign later — job starts as New</option>
                  {eligible.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </FormField>
              <FormField id="priority" label="Priority" hint="High priority is flagged across the pipeline.">
                <select id="priority" name="priority" className="w-full">
                  <option>Normal</option>
                  <option>High</option>
                </select>
              </FormField>
            </div>
            {eligible.length === 0 && (
              <InlineAlert tone="warning" className="mt-4">
                No assessor currently holds a mandate for this template. The job
                can still be created — it will sit in the pipeline as unassigned.
              </InlineAlert>
            )}
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon="plus"
              busy={pending}
              busyLabel="Creating job"
              disabled={!!tpl?.is_reference_only}
            >
              Create {isSurvey ? "survey" : "assessment"}
            </Button>
            <p className="text-xs text-muted">
              You’ll land on the job page, where you can book the appointment.
            </p>
          </div>
        </div>

        {/* ---- Template preview ------------------------------------------- */}
        <aside className="lg:sticky lg:top-2 lg:self-start">
          <section className="rounded-lg border border-border bg-background shadow-1">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Template preview</h2>
              <p className="mt-0.5 text-xs text-muted">What this choice commits the assessor to</p>
            </div>

            <div className="p-4">
              {!tpl ? (
                <p className="text-sm text-muted">Choose a template to preview it.</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <JobTypeBadge jobType={tpl.job_type} />
                    <Badge tone="neutral"><span className="font-mono">v{tpl.version}</span></Badge>
                    {!!tpl.is_limited && <Badge tone="warning" icon="warning">Limited depth</Badge>}
                    {!!tpl.is_reference_only && <Badge tone="danger" icon="lock">Not bookable</Badge>}
                  </div>

                  {!!tpl.is_reference_only && (
                    <InlineAlert tone="danger" className="mt-3" title="Physical-first — virtual triage only">
                      For this peril a virtual session is triage, not an
                      assessment. It is disabled here and refused by the server
                      even if the option is forced. The stored checklist exists
                      so reviewers can see the intended scope.
                    </InlineAlert>
                  )}

                  {!!tpl.is_limited && (
                    <InlineAlert tone="warning" className="mt-3" title="Deliberately limited template">
                      Reduced depth for the prototype. Heavy or industrial risks
                      must route to a physical survey from the start — the report
                      says so under limitations.
                    </InlineAlert>
                  )}

                  <DetailList
                    className="mt-4"
                    labelWidth="8.5rem"
                    rows={[
                      { term: "Structure", value: `${tpl.sections.length} sections · ${items.length} checklist items` },
                      { term: "Photos required", value: evidenceCount > 0 ? `${evidenceCount} items must have evidence` : "None mandatory" },
                      { term: "High-res needed", value: hiResCount > 0 ? `${hiResCount} items (plates, serials, documents)` : "None" },
                      { term: "Client guidance", value: guidedCount > 0 ? `${guidedCount} items push an instruction to the client` : "None" },
                      { term: "Slot", value: tpl.job_type === "survey" ? "90 min" : "20–60 min by peril" },
                    ]}
                  />

                  {tpl.sections.length > 0 && (
                    <>
                      <h3 className="mt-4 border-t border-border pt-3 text-xs font-semibold text-foreground">Sections</h3>
                      <ol className="mt-2 space-y-1.5">
                        {tpl.sections.map((s, i) => {
                          const need = s.items.filter((it) => it.evidenceRequired).length;
                          return (
                            <li key={s.key} className="flex gap-2 text-sm">
                              <span className="w-4 shrink-0 text-right text-xs text-muted-light tnum">{i + 1}</span>
                              <span className="min-w-0">
                                <span className="text-foreground">{s.title}</span>
                                <span className="block text-xs text-muted">
                                  {s.items.length} items{need > 0 ? ` · ${need} need a photo` : ""}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </>
                  )}

                  {tpl.sections.length === 0 && (
                    <p className="mt-3 text-sm text-muted">
                      Reference-only template — no checklist is wired for the
                      prototype.
                    </p>
                  )}

                  <p className="mt-4 flex gap-2 border-t border-border pt-3 text-xs text-muted">
                    <Icon name="info" size={14} className="mt-px shrink-0" />
                    All prototype templates are demo content pending assessor
                    workshop sign-off. Editing one means a version bump.
                  </p>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
