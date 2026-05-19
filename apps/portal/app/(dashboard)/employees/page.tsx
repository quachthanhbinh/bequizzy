"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchCatalog, type CatalogListResponse } from "@/lib/api/employees";

function useCatalog() {
  return useQuery<CatalogListResponse>({
    queryKey: ["employees-catalog"],
    queryFn: () => fetchCatalog(),
  });
}

export default function EmployeesPage() {
  const { data, isLoading, isError } = useCatalog();
  const entries = data?.data ?? [];
  const comingSoon = data?.meta?.coming_soon ?? false;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Employees</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rent AI-powered sales employees that work for you 24/7.
            </p>
          </div>
          <Link href="/employees/rentals" className="btn btn-ghost gap-1.5 shrink-0">
            My Rentals
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-48 animate-pulse bg-muted/40" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load AI Employee catalog. Please refresh the page.
          </div>
        )}

        {/* Coming soon */}
        {!isLoading && !isError && comingSoon && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                AI Employees are being trained and will be available shortly. Check back soon.
              </p>
            </div>
          </div>
        )}

        {/* Catalog grid */}
        {!isLoading && entries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/employees/catalog/${entry.slug}`}
                className="card p-5 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    {entry.category}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {entry.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    ${entry.monthly_rental_price_usd}
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ~{entry.credits_per_run_estimate} credits/run
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
