"use client";

import { useTour } from "@/hooks/use-tour";

/**
 * Floating help button that re-launches the current page's spotlight tour.
 * Rendered inside the dashboard layout header. Hidden on pages with no tour.
 */
export function TourButton() {
  const { startTour, hasSteps } = useTour();

  if (!hasSteps) return null;

  return (
    <button
      onClick={startTour}
      title="Page tour"
      aria-label="Start page tour"
      className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500 text-sm font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors shadow-sm"
    >
      ?
    </button>
  );
}
