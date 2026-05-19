"use client";

export default function SoloPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solo Operator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Simplified command center for solo founders running outreach alone
          </p>
        </div>

        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Solo mode coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            A simplified daily briefing view — hot leads, approval queue, today&apos;s meetings —
            in one focused dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
