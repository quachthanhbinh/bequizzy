"use client";

import { useState } from "react";
import { useDeals, useMoveDeal, useDealStages, type Deal } from "@/hooks/useCRM";

const STAGE_COLORS: Record<number, string> = {
  0: "bg-slate-100",
  1: "bg-blue-50",
  2: "bg-purple-50",
  3: "bg-amber-50",
  4: "bg-teal-50",
  5: "bg-red-50",
};

function formatCurrency(value: number | null) {
  if (!value) return "$0";
  return `$${value.toLocaleString()}`;
}

export default function CRMPage() {
  const { data: stages, isLoading: stagesLoading } = useDealStages();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const moveDealMutation = useMoveDeal();

  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const isLoading = stagesLoading || dealsLoading;
  const allDeals = deals ?? [];
  const allStages = stages ?? [];

  const openCount = allDeals.filter((d) => d.status === "open").length;
  const pipeline = allDeals
    .filter((d) => d.status === "open")
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  function handleDrop(stageId: string) {
    if (!dragging) return;
    moveDealMutation.mutate({ dealId: dragging, stageId });
    if (selectedDeal?.id === dragging) {
      setSelectedDeal((prev) => prev ? { ...prev, stage_id: stageId } : prev);
    }
    setDragging(null);
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
        <div>
          <h1 className="text-base font-bold text-foreground">CRM Pipeline</h1>
          <p className="text-xs text-muted-foreground">
            {openCount} open deal{openCount !== 1 ? "s" : ""} · {formatCurrency(pipeline)} pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm">View: Kanban</button>
          <button className="btn btn-primary btn-sm gap-1.5">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Deal
          </button>
        </div>
      </div>

      {/* Empty state */}
      {allStages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">No pipeline stages yet.</p>
          <button className="btn btn-primary btn-sm">Set up pipeline</button>
        </div>
      )}

      {/* Kanban */}
      {allStages.length > 0 && (
        <div className="flex-1 overflow-x-auto p-5">
          <div className="flex gap-4 h-full min-w-max">
            {allStages.sort((a, b) => a.position - b.position).map((stage, idx) => {
              const stageDeals = allDeals.filter((d) => d.stage_id === stage.id);
              const stageValue = stageDeals.reduce((a, d) => a + (d.amount ?? 0), 0);
              const color = STAGE_COLORS[idx] ?? "bg-slate-100";
              return (
                <div key={stage.id}
                  className="flex flex-col w-60 shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage.id)}>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${color}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{stage.name}</span>
                      <span className="text-xs text-muted-foreground bg-white/60 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                    </div>
                    {stageValue > 0 && <span className="text-xs font-medium text-muted-foreground">{formatCurrency(stageValue)}</span>}
                  </div>

                  <div className="flex flex-col gap-2 flex-1 p-2 bg-secondary/30 rounded-b-xl min-h-32">
                    {stageDeals.map((deal) => (
                      <div key={deal.id}
                        data-testid="deal-card"
                        draggable
                        onDragStart={() => setDragging(deal.id)}
                        onClick={() => setSelectedDeal(deal)}
                        className={`bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-border select-none ${dragging === deal.id ? "opacity-50" : ""}`}>
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{deal.title}</p>
                            {deal.lead_id && <p className="text-xs text-muted-foreground truncate">Lead #{deal.lead_id.slice(0, 8)}</p>}
                          </div>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${deal.status === "won" ? "bg-teal-50 text-teal-700" : deal.status === "lost" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                            {deal.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-2">{formatCurrency(deal.amount)}</p>
                      </div>
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deal detail drawer */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedDeal(null)} />
          <div className="w-96 bg-background border-l border-border overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Deal Details</h2>
              <button onClick={() => setSelectedDeal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedDeal.title}</h3>
                <p className="text-sm text-muted-foreground capitalize">{selectedDeal.status}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedDeal.amount)}</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Stage", value: allStages.find((s) => s.id === selectedDeal.stage_id)?.name ?? "—" },
                  { label: "Status", value: selectedDeal.status },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Move to Stage</p>
                <div className="grid grid-cols-2 gap-2">
                  {allStages.filter((s) => s.id !== selectedDeal.stage_id).map((s) => (
                    <button key={s.id}
                      disabled={moveDealMutation.isPending}
                      onClick={() => {
                        moveDealMutation.mutate({ dealId: selectedDeal.id, stageId: s.id });
                        setSelectedDeal({ ...selectedDeal, stage_id: s.id });
                      }}
                      className="py-1.5 rounded-lg text-xs font-medium transition-colors border border-border hover:bg-secondary bg-white">
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-outline btn-sm w-full" onClick={() => setSelectedDeal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
