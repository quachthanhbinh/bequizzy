"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { TOURS, getTourDoneKey } from "@/lib/tour/tours";

/**
 * Triggers the driver.js spotlight tour for the current page on first visit.
 * Call `startTour()` imperatively to re-launch the tour manually (e.g., help button).
 */
export function useTour() {
  const pathname = usePathname();
  // Normalise dynamic segments: /campaigns/abc → /campaigns
  const basePath = "/" + pathname.split("/").filter(Boolean)[0] || "/dashboard";
  const steps = TOURS[basePath] ?? TOURS[pathname];
  const driverRef = useRef<{ destroy: () => void } | null>(null);

  const startTour = useCallback(async () => {
    if (!steps?.length) return;

    // Lazy-load driver.js only when needed (reduces initial bundle)
    const { driver } = await import("driver.js");

    driverRef.current?.destroy();

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.55,
      smoothScroll: true,
      allowClose: true,
      doneBtnText: "Got it ✓",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      onDestroyed: () => {
        try {
          localStorage.setItem(getTourDoneKey(basePath), "1");
        } catch {
          // localStorage may be blocked (private mode)
        }
      },
      steps: steps.map((s) => ({
        element: s.element,
        popover: {
          title: s.popover.title,
          description: s.popover.description,
          side: s.popover.side ?? "bottom",
          align: s.popover.align ?? "start",
        },
      })),
    });

    driverObj.drive();
    driverRef.current = driverObj;
  }, [steps, basePath]);

  // Auto-start on first visit
  useEffect(() => {
    if (!steps?.length) return;
    let done = false;
    try {
      done = localStorage.getItem(getTourDoneKey(basePath)) === "1";
    } catch {
      // ignore
    }
    if (!done) {
      // Small delay so the page has rendered its DOM nodes before driver.js queries them
      const t = setTimeout(startTour, 600);
      return () => clearTimeout(t);
    }
  }, [basePath, steps, startTour]);

  return { startTour, hasSteps: !!steps?.length };
}
