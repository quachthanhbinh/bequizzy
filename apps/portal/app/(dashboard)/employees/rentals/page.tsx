"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchRentals, type Rental } from "@/lib/api/employees";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-teal-50 text-teal-700",
  paused: "bg-amber-50 text-amber-700",
  auto_paused: "bg-amber-100 text-amber-800",
  cancelling: "bg-rose-50 text-rose-600",
  cancelled: "bg-slate-100 text-slate-400",
};

function useRentals() {
  return useQuery<Rental[]>({
    queryKey: ["employee-rentals"],
    queryFn: () => fetchRentals(),
  });
}

export default function RentalsPage() {
  const { data, isLoading, isError } = useRentals();
  const rentals = data ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My AI Employees</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your active rentals.</p>
          </div>
          <Link href="/employees" className="btn btn-primary shrink-0">
            Browse Catalog
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-muted/40" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load rentals.
          </div>
        )}

        {!isLoading && rentals.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No rentals yet.{" "}
            <Link href="/employees" className="text-primary hover:underline">Browse the catalog</Link>{" "}
            to hire your first AI Employee.
          </div>
        )}

        {rentals.map((rental) => (
          <Link key={rental.id} href={`/employees/rentals/${rental.id}`} className="card p-5 hover:border-primary/40 transition-colors block">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground font-mono text-xs text-muted-foreground">
                    {rental.id.slice(0, 8)}…
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[rental.status] ?? "bg-muted text-muted-foreground"}`}>
                    {rental.status.replace("_", " ")}
                  </span>
                  {rental.dry_run_until && new Date(rental.dry_run_until) > new Date() && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium">
                      Dry-run
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Daily cap ${rental.daily_spend_cap_usd} · Monthly cap ${rental.monthly_spend_cap_usd}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Rented {new Date(rental.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
