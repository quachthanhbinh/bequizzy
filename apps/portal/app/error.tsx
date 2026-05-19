"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: log to error tracking (Sentry / Cloud Logging)
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      {/* Illustration */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.25}
          className="text-destructive"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Text */}
      <p className="text-sm font-semibold text-destructive uppercase tracking-widest mb-3">500 — Server error</p>
      <h1 className="text-3xl font-bold text-foreground mb-3">Something went wrong</h1>
      <p className="text-base text-muted-foreground max-w-sm leading-relaxed mb-2">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono mb-6">
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-6" />}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-outline">
          Go to dashboard
        </Link>
      </div>

      {/* Branding */}
      <p className="mt-12 text-xs text-muted-foreground/50">
        <Link href="https://revlooper.com" className="hover:text-muted-foreground transition-colors">
          RevLooper
        </Link>
        {" "}· app.revlooper.com
      </p>
    </div>
  );
}
