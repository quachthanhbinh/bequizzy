"use client";

export default function SocialInboundPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Social Inbound</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Auto-DM commenters on your Facebook &amp; Instagram posts, then capture them as leads
            </p>
          </div>
        </div>

        <div className="card p-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Connect a social channel to get started</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Connect your Facebook Page or Instagram account to track post comments, auto-send DMs, and capture leads.
          </p>
          <a href="/integrations" className="btn btn-primary min-h-[44px]">
            Go to Integrations
          </a>
        </div>
      </div>
    </div>
  );
}
