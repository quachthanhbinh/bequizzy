import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      {/* Illustration */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.25}
          className="text-primary"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Text */}
      <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">404 — Not found</p>
      <h1 className="text-3xl font-bold text-foreground mb-3">Page not found</h1>
      <p className="text-base text-muted-foreground max-w-sm leading-relaxed mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>
        <Link href="/" className="btn btn-outline">
          Back to home
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
