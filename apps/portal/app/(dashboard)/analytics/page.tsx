"use client";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Campaign performance and A/B test results
          </p>
        </div>

        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">No analytics data yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Analytics will appear here once your campaigns start sending. Launch a campaign to see
            open rates, reply rates, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
