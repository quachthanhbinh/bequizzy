"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchRental, cancelRental, type Rental } from "@/lib/api/employees";

function useRental(id: string) {
  return useQuery<Rental>({
    queryKey: ["employee-rental", id],
    queryFn: () => fetchRental(id),
  });
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-teal-50 text-teal-700",
  paused: "bg-amber-50 text-amber-700",
  auto_paused: "bg-amber-100 text-amber-800",
  cancelling: "bg-rose-50 text-rose-600",
  cancelled: "bg-slate-100 text-slate-400",
};

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: rental, isLoading, isError } = useRental(id);

  const cancelMutation = useMutation({
    mutationFn: () => cancelRental(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-rental", id] });
      queryClient.invalidateQueries({ queryKey: ["employee-rentals"] });
    },
  });

  if (isLoading) return <div className="flex-1 p-6 text-sm text-muted-foreground">Loading…</div>;
  if (isError || !rental) return <div className="flex-1 p-6 text-sm text-destructive">Rental not found.</div>;

  const inDryRun = rental.dry_run_until && new Date(rental.dry_run_until) > new Date();
  const isCancellable = ["active", "paused", "auto_paused"].includes(rental.status);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <nav className="text-sm text-muted-foreground flex gap-1">
          <Link href="/employees/rentals" className="hover:text-foreground transition-colors">My Rentals</Link>
          <span>/</span>
          <span className="text-foreground font-mono">{rental.id.slice(0, 8)}…</span>
        </nav>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground font-mono">{rental.id.slice(0, 8)}…</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[rental.status] ?? "bg-muted text-muted-foreground"}`}>
                  {rental.status.replace("_", " ")}
                </span>
                {inDryRun && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium">
                    Dry-run until {new Date(rental.dry_run_until!).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {isCancellable && (
              <button
                onClick={() => {
                  if (window.confirm("Cancel this rental? The agent will stop after the grace window.")) {
                    cancelMutation.mutate();
                  }
                }}
                className="btn btn-destructive-ghost text-sm"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling…" : "Cancel rental"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Daily cap</div>
              <div className="font-medium">${rental.daily_spend_cap_usd}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Monthly cap</div>
              <div className="font-medium">${rental.monthly_spend_cap_usd}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Per-run ceiling</div>
              <div className="font-medium">{rental.per_run_credit_ceiling} credits</div>
            </div>
          </div>

          {rental.status === "cancelling" && rental.cancellation_grace_ends_at && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Cancellation in progress. The agent will stop on{" "}
              <strong>{new Date(rental.cancellation_grace_ends_at).toLocaleDateString()}</strong>.
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/employees/rentals/${id}/runs`} className="card p-4 hover:border-primary/40 transition-colors">
            <div className="text-sm font-medium text-foreground">Run History</div>
            <div className="text-xs text-muted-foreground mt-0.5">View all AI runs</div>
          </Link>
          <Link href={`/employees/rentals/${id}/sops`} className="card p-4 hover:border-primary/40 transition-colors">
            <div className="text-sm font-medium text-foreground">SOPs</div>
            <div className="text-xs text-muted-foreground mt-0.5">Manage instructions</div>
          </Link>
          <Link href={`/employees/approvals?rental_id=${id}`} className="card p-4 hover:border-primary/40 transition-colors">
            <div className="text-sm font-medium text-foreground">Approvals</div>
            <div className="text-xs text-muted-foreground mt-0.5">Review pending actions</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
