"use client";

export default function WorkspacePage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspace Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage client workspaces and agency billing (Agency plan)
          </p>
        </div>

        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Agency workspace management</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Multi-workspace management is available on the Agency plan. Upgrade to manage multiple
            client workspaces from a single admin view.
          </p>
        </div>
      </div>
    </div>
  );
}
