"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSequence, useSequenceSteps, useAddSequenceStep, type SequenceStep } from "@/hooks/useSequences";

type StepType = "email" | "wait" | "condition" | "ab_split" | "linkedin" | "sms";

interface Step {
  id: string;
  type: StepType;
  label: string;
  config: Record<string, string | number>;
  persisted: boolean; // true if already saved to backend
}

const STEP_ICONS: Record<StepType, JSX.Element> = {
  email:     <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  wait:      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  condition: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
  ab_split:  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>,
  linkedin:  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>,
  sms:       <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
};

const STEP_COLOR: Record<StepType, string> = {
  email:     "bg-teal-50 text-teal-700 border-teal-200",
  wait:      "bg-slate-50 text-slate-600 border-slate-200",
  condition: "bg-amber-50 text-amber-700 border-amber-200",
  ab_split:  "bg-purple-50 text-purple-700 border-purple-200",
  linkedin:  "bg-blue-50 text-blue-700 border-blue-200",
  sms:       "bg-green-50 text-green-700 border-green-200",
};

const STEP_PALETTE: { type: StepType; label: string }[] = [
  { type: "email",     label: "Email" },
  { type: "wait",      label: "Wait" },
  { type: "condition", label: "Condition" },
  { type: "ab_split",  label: "A/B Split" },
  { type: "linkedin",  label: "LinkedIn" },
  { type: "sms",       label: "SMS" },
];

function apiStepToLocal(s: SequenceStep): Step {
  const knownTypes: StepType[] = ["email", "wait", "condition", "ab_split", "linkedin", "sms"];
  const type: StepType = knownTypes.includes(s.stepType as StepType) ? (s.stepType as StepType) : "email";
  const label = (s.config.label as string) ?? `${type} step`;
  return { id: s.id, type, label, config: s.config as Record<string, string | number>, persisted: true };
}

export default function SequenceDetailPage() {
  const params = useParams();
  const sequenceId = typeof params?.id === "string" ? params.id : null;

  const { data: sequence, isLoading: seqLoading } = useSequence(sequenceId);
  const { data: apiSteps, isLoading: stepsLoading } = useSequenceSteps(sequenceId);
  const addStepMutation = useAddSequenceStep();

  const [steps, setSteps] = useState<Step[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"builder" | "enrollments" | "analytics">("builder");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Initialise steps from API once loaded
  useEffect(() => {
    if (apiSteps && apiSteps.length > 0) {
      const loaded = [...apiSteps].sort((a, b) => a.position - b.position).map(apiStepToLocal);
      setSteps(loaded);
      setSelected(loaded[0]?.id ?? null);
    }
  }, [apiSteps]);

  function addStep(type: StepType) {
    const id = `new-${Date.now()}`;
    const label = type === "wait" ? "Wait 2 days" : type === "email" ? "New email step" : `New ${type} step`;
    setSteps((s) => [...s, { id, type, label, config: {}, persisted: false }]);
    setSelected(id);
  }

  function removeStep(id: string) {
    setSteps((s) => s.filter((step) => step.id !== id));
    if (selected === id) setSelected(null);
  }

  async function handleSave() {
    if (!sequenceId) return;
    const newSteps = steps.filter((s) => !s.persisted);
    if (newSteps.length === 0) {
      setSaveMsg("No new steps to save.");
      setTimeout(() => setSaveMsg(null), 2000);
      return;
    }
    setSaving(true);
    try {
      for (let i = 0; i < newSteps.length; i++) {
        const s = newSteps[i];
        const position = steps.findIndex((st) => st.id === s.id);
        await addStepMutation.mutateAsync({
          sequenceId,
          input: { stepType: s.type, position, config: { ...s.config, label: s.label } },
        });
      }
      // Mark all as persisted
      setSteps((prev) => prev.map((s) => ({ ...s, persisted: true })));
      setSaveMsg("Steps saved.");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  const sel = steps.find((s) => s.id === selected);
  const isLoading = seqLoading || stepsLoading;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-border bg-background shrink-0">
        <Link href="/sequences" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-foreground truncate">
          {isLoading ? "Loading…" : sequence?.name ?? "Sequence"}
        </h1>
        {sequence && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
            sequence.status === "active" ? "bg-teal-50 text-teal-700" :
            sequence.status === "paused" ? "bg-amber-50 text-amber-700" :
            "bg-slate-100 text-slate-500"
          }`}>{sequence.status}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saveMsg && <span className="text-xs text-muted-foreground">{saveMsg}</span>}
          <button className="btn btn-outline btn-sm" disabled>Pause</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0.5 border-b border-border px-5 bg-background shrink-0">
        {(["builder","enrollments","analytics"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "builder" && (
        <div className="flex flex-1 min-h-0">
          {/* Step canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-secondary/30">
            <div className="max-w-lg mx-auto space-y-2">
              {/* Start node */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary rounded-full text-white text-xs font-semibold shadow-sm">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                  Enrolled lead enters
                </div>
              </div>

              {steps.map((step, idx) => (
                <div key={step.id} className="relative">
                  {/* Connector line */}
                  <div className="flex justify-center h-5">
                    <div className="w-px bg-border" />
                  </div>
                  {/* Step card */}
                  <div
                    onClick={() => setSelected(step.id)}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${selected === step.id ? "border-primary shadow-md" : `border ${STEP_COLOR[step.type].split(" ")[2]}`} ${STEP_COLOR[step.type].split(" ").slice(0,2).join(" ")} bg-white`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${STEP_COLOR[step.type]}`}>
                        {STEP_ICONS[step.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{step.type.replace(/_/g, " ")}</p>
                      </div>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-border text-muted-foreground text-xs font-bold">{idx + 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add step connector */}
              <div className="flex justify-center h-5">
                <div className="w-px bg-border" />
              </div>
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-border rounded-xl p-4 w-full">
                  <p className="text-xs text-center text-muted-foreground mb-3">Add a step</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {STEP_PALETTE.map(({ type, label }) => (
                      <button key={type} onClick={() => addStep(type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:shadow-sm ${STEP_COLOR[type]}`}>
                        {STEP_ICONS[type]}{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* End node */}
              <div className="flex justify-center h-5">
                <div className="w-px bg-border" />
              </div>
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-500 text-xs font-semibold">
                  Sequence ends
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — step editor */}
          <div className="w-72 border-l border-border bg-background overflow-y-auto p-5 shrink-0">
            {sel ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Edit Step</h3>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Step name</label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={sel.label}
                    onChange={(e) => setSteps((s) => s.map((st) => st.id === sel.id ? { ...st, label: e.target.value } : st))}
                  />
                </div>
                {sel.type === "email" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Subject line</label>
                      <input
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        value={(sel.config.subject as string) ?? ""}
                        onChange={(e) => setSteps((s) => s.map((st) => st.id === sel.id ? { ...st, config: { ...st.config, subject: e.target.value } } : st))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Use {"{{firstName}}"} {"{{company}}"} for personalisation</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Email body</label>
                      <textarea rows={6}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Write your email here. Use {{firstName}}, {{company}}, {{title}} for personalisation."
                      />
                    </div>
                    <button className="btn btn-outline btn-sm w-full gap-1.5">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      AI-write this email (2 credits)
                    </button>
                  </>
                )}
                {sel.type === "wait" && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Wait duration (days)</label>
                    <input type="number" min={1} max={30}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      value={(sel.config.days as number) ?? 2}
                      onChange={(e) => setSteps((s) => s.map((st) => st.id === sel.id ? { ...st, config: { ...st.config, days: parseInt(e.target.value) } } : st))}
                    />
                  </div>
                )}
                {sel.type === "condition" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Condition</label>
                      <select className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                        <option>Email was opened</option>
                        <option>Email was clicked</option>
                        <option>Lead replied</option>
                        <option>Has tag</option>
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">Branches: <strong>Yes</strong> / <strong>No</strong> paths will appear in the canvas</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a step to edit</p>
            )}
          </div>
        </div>
      )}

      {tab === "enrollments" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Step</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: "Nguyen Minh", email: "minh@techstartup.vn", step: "Step 3 – Follow-up", status: "active", next: "May 9, 2026" },
                      { name: "Krit Sukanya", email: "krit@saasplatform.co.th", step: "Step 2 – Wait 3 days", status: "active", next: "May 7, 2026" },
                      { name: "Marcus Wong", email: "marcus@marketingco.sg", step: "Step 5 – Meeting ask", status: "active", next: "Today" },
                      { name: "David Tran", email: "dtran@fintech.vn", step: "Step 1 – Cold intro", status: "paused", next: "—" },
                      { name: "Aisha Mohamed", email: "a.mohamed@example.com", step: "Step 1", status: "unsubscribed", next: "—" },
                    ].map((r) => (
                      <tr key={r.email} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.step}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${r.status === "active" ? "bg-teal-50 text-teal-700" : r.status === "paused" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{r.next}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Enrolled", value: "340" },
                { label: "Open rate", value: "38%" },
                { label: "Reply rate", value: "12%" },
                { label: "Meetings booked", value: "8" },
              ].map(({ label, value }) => (
                <div key={label} className="card p-5 text-center">
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
            {/* Step funnel */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Step Funnel</h3>
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const pct = Math.max(15, 100 - idx * 18);
                  return (
                    <div key={step.id}>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{step.label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
