"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  fetchApprovals,
  approveAction,
  rejectAction,
  type ApprovalRequest,
} from "@/lib/api/employees";

function useApprovals(status?: string) {
  return useQuery<ApprovalRequest[]>({
    queryKey: ["employee-approvals", status],
    queryFn: () => fetchApprovals(status),
  });
}

const RISK_COLOR = (score: number) => {
  if (score >= 70) return "text-rose-600";
  if (score >= 40) return "text-amber-600";
  return "text-emerald-600";
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal-50 text-teal-700",
  rejected: "bg-slate-100 text-slate-500",
  expired: "bg-slate-100 text-slate-400",
};

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get("status") ?? "pending";
  const queryClient = useQueryClient();
  const { data, isLoading } = useApprovals(filterStatus === "all" ? undefined : filterStatus);
  const approvals = data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-approvals"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-approvals"] }),
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Employee Approvals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and approve actions your AI Employees want to take.
            </p>
          </div>
          <Link href="/employees/rentals" className="btn btn-ghost shrink-0">My Rentals</Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 text-sm flex-wrap">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <Link
              key={s}
              href={`/employees/approvals?status=${s}`}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-muted/40" />
            ))}
          </div>
        )}

        {!isLoading && approvals.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No {filterStatus !== "all" ? filterStatus : ""} approvals.
          </div>
        )}

        {approvals.map((approval) => (
          <div key={approval.id} className="card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[approval.status] ?? "bg-muted text-muted-foreground"}`}>
                    {approval.status}
                  </span>
                  <span className={`text-xs font-semibold ${RISK_COLOR(approval.risk_score)}`}>
                    Risk {approval.risk_score}/100
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ~${approval.estimated_cost_usd}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">{approval.reasoning}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expected: {approval.expected_outcome}
                </p>
              </div>
              <div className="text-xs text-muted-foreground text-right shrink-0">
                <div>Expires {new Date(approval.expires_at).toLocaleString()}</div>
              </div>
            </div>

            {approval.rollback_plan && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                <strong>Rollback plan:</strong> {approval.rollback_plan}
              </div>
            )}

            {approval.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => approveMutation.mutate(approval.id)}
                  disabled={approveMutation.isPending}
                  className="btn btn-primary text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectMutation.mutate(approval.id)}
                  disabled={rejectMutation.isPending}
                  className="btn btn-ghost text-sm"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
