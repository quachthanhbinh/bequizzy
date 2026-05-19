"use client";

export default function AutomationPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trigger actions automatically based on lead signals and events
            </p>
          </div>
          <button type="button" className="btn btn-primary gap-1.5 shrink-0" disabled>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Automation
          </button>
        </div>

        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Automations coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Set up trigger-based actions — like notifying Slack when a lead scores Hot, or creating
            a CRM deal when a meeting is booked.
          </p>
        </div>
      </div>
    </div>
  );
}
