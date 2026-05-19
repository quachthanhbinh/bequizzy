"use client";

export default function RevenuePage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pipeline value and revenue attribution from outreach campaigns
          </p>
        </div>

        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">No revenue data yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Revenue signals will appear here once deals are created and won in your CRM pipeline.
          </p>
        </div>
      </div>
    </div>
  );
}
