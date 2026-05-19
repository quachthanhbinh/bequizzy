"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCatalogEntry, type CatalogDetail } from "@/lib/api/employees";

function useCatalogEntry(slug: string) {
  return useQuery<CatalogDetail>({
    queryKey: ["employees-catalog", slug],
    queryFn: () => fetchCatalogEntry(slug),
  });
}

const SIDE_EFFECT_LABEL: Record<string, string> = {
  read_only: "Read-only",
  internal_write: "Internal write",
  external_api: "External API",
  publish_public: "Publishes publicly",
};

const SIDE_EFFECT_CLASS: Record<string, string> = {
  read_only: "bg-emerald-50 text-emerald-700",
  internal_write: "bg-sky-50 text-sky-700",
  external_api: "bg-amber-50 text-amber-700",
  publish_public: "bg-rose-50 text-rose-700",
};

export default function CatalogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useCatalogEntry(slug);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 p-6">
        <div className="text-sm text-destructive">Agent not found or unavailable.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground flex gap-1">
          <Link href="/employees" className="hover:text-foreground transition-colors">AI Employees</Link>
          <span>/</span>
          <span className="text-foreground">{data.name}</span>
        </nav>

        {/* Hero */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{data.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-foreground">
                ${data.monthly_rental_price_usd}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="text-xs text-muted-foreground">~{data.credits_per_run_estimate} credits/run</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Daily cap</div>
              <div className="font-medium">${data.default_daily_spend_cap_usd}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Monthly cap</div>
              <div className="font-medium">${data.default_monthly_spend_cap_usd}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Free trial</div>
              <div className="font-medium">{data.default_dry_run_days} days dry-run</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <div className="font-medium capitalize">{data.category}</div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              href={`/employees/rent/${data.id}`}
              className="btn btn-primary"
            >
              Rent this employee
            </Link>
            <Link href="/employees/rentals" className="btn btn-ghost">
              My Rentals
            </Link>
          </div>
        </div>

        {/* Tools */}
        {data.tools.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">What this employee can do</h2>
            <div className="space-y-2">
              {data.tools.map((tool) => (
                <div key={tool.id} className="card p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{tool.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SIDE_EFFECT_CLASS[tool.side_effect_class] ?? "bg-muted text-muted-foreground"}`}>
                        {SIDE_EFFECT_LABEL[tool.side_effect_class] ?? tool.side_effect_class}
                      </span>
                      {tool.requires_approval_above_usd && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                          Approval &gt;${tool.requires_approval_above_usd}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">max {tool.max_per_run}/run</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
