import Link from "next/link";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 px-6 text-center">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white text-sm font-bold shadow-lg">
          RL
        </span>
        <span className="text-xl font-bold text-white tracking-tight">RevLooper</span>
      </div>

      {/* Illustration */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.25}
          className="text-teal-200"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
          />
        </svg>
      </div>

      {/* Text */}
      <p className="text-sm font-semibold text-teal-300 uppercase tracking-widest mb-3">
        503 — Maintenance
      </p>
      <h1 className="text-3xl font-bold text-white mb-4">We&apos;ll be right back</h1>
      <p className="text-base text-teal-100/65 max-w-sm leading-relaxed mb-8">
        RevLooper is currently undergoing scheduled maintenance. We&apos;re working hard to get things back online as quickly as possible.
      </p>

      {/* Status card */}
      <div className="w-full max-w-sm rounded-xl bg-white/10 backdrop-blur border border-white/15 p-5 mb-8 text-left space-y-3">
        <p className="text-xs font-semibold text-teal-200 uppercase tracking-wide">Current status</p>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
          </span>
          <p className="text-sm text-white">Maintenance in progress</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400" />
          <p className="text-sm text-teal-100/70">Database · Operational</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400" />
          <p className="text-sm text-teal-100/70">Email delivery · Operational</p>
        </div>
      </div>

      {/* Follow updates */}
      <p className="text-sm text-teal-200/60 mb-2">Stay updated</p>
      <div className="flex gap-3">
        <a
          href="https://revlooper.com"
          className="btn bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          Visit website
        </a>
        <Link
          href="mailto:support@revlooper.com"
          className="btn bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          Contact support
        </Link>
      </div>

      <p className="mt-10 text-xs text-teal-300/40">
        app.revlooper.com
      </p>
    </div>
  );
}
