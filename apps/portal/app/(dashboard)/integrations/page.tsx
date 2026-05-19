"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useIntegrations, useConnectIntegration, useDisconnectIntegration, useConnectWithCredentials, useOAuthUrl } from "@/hooks/useIntegrations";

type Category = "email" | "crm" | "calendar" | "communication" | "data";
type ConnStatus = "connected" | "disconnected" | "coming_soon";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: Category;
  extraCategories?: Category[];
  logo: ReactNode;
  comingSoon: boolean;
}

interface Integration extends CatalogItem {
  status: ConnStatus;
  liveId?: string;
  connectedAs?: string;
  connectedAt?: string;
}

const CAT_LABEL: Record<Category, string> = {
  email: "Email",
  crm: "CRM",
  calendar: "Calendar",
  communication: "Communication",
  data: "Data & Enrichment",
};

// ─── Brand SVG logos ──────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.2 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.8 6C12.2 13.1 17.6 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z"/>
      <path fill="#FBBC05" d="M10.3 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.8-6z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.4 0-11.8-3.6-13.7-8.8l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

function Microsoft365Logo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7">
      <path fill="#F25022" d="M4 4h19v19H4z"/>
      <path fill="#7FBA00" d="M25 4h19v19H25z"/>
      <path fill="#00A4EF" d="M4 25h19v19H4z"/>
      <path fill="#FFB900" d="M25 25h19v19H25z"/>
    </svg>
  );
}

function SmtpLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect x="4" y="12" width="40" height="28" rx="3" fill="#6366F1"/>
      <path d="M4 16l20 13 20-13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 8h20" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
    </svg>
  );
}

function CalComLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect x="4" y="8" width="40" height="36" rx="4" fill="#111827"/>
      <path d="M15 24h18M15 30h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="14" y="12" width="4" height="8" rx="1" fill="#6EE7B7"/>
      <rect x="30" y="12" width="4" height="8" rx="1" fill="#6EE7B7"/>
    </svg>
  );
}

function HubSpotLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7">
      <circle cx="32" cy="14" r="6" fill="#FF7A59"/>
      <path fill="#FF7A59" d="M26 22a6 6 0 0 0-6 6v8h4v-8a2 2 0 0 1 2-2h2v-4z"/>
      <circle cx="20" cy="36" r="5" fill="#FF7A59"/>
    </svg>
  );
}

function SalesforceLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7">
      <path fill="#00A1E0" d="M20 10c-3.9 0-7.3 2.2-9 5.4A8 8 0 0 0 2 23a8 8 0 0 0 8 8h26a6 6 0 0 0 6-6 6 6 0 0 0-6-6 5.9 5.9 0 0 0-1.4.2A10 10 0 0 0 20 10z"/>
    </svg>
  );
}

function PipedriveLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <circle cx="24" cy="24" r="20" fill="#017737"/>
      <path d="M22 14v8a6 6 0 1 0 4 0V14h-4z" fill="#fff"/>
      <circle cx="24" cy="30" r="4" fill="#fff"/>
    </svg>
  );
}

function SlackLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7">
      <path fill="#E01E5A" d="M13 28a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v4zm2 0a4 4 0 0 1 4-4 4 4 0 0 1 4 4v10a4 4 0 0 1-4 4 4 4 0 0 1-4-4V28z"/>
      <path fill="#36C5F0" d="M19 13a4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4v4h-4zm0 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4H9a4 4 0 0 1-4-4 4 4 0 0 1 4-4h10z"/>
      <path fill="#2EB67D" d="M34 19a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-4v-4a4 4 0 0 1 4-4zm-2 0a4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4v10a4 4 0 0 1-4 4 4 4 0 0 1-4-4V19z"/>
      <path fill="#ECB22E" d="M28 34a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4h4zm0-2a4 4 0 0 1-4-4 4 4 0 0 1 4-4h10a4 4 0 0 1 4 4 4 4 0 0 1-4 4H28z"/>
    </svg>
  );
}

function ZaloLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#0068FF"/>
      <text x="24" y="31" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">Zalo</text>
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7">
      <circle cx="24" cy="24" r="20" fill="#25D366"/>
      <path fill="#fff" d="M34.5 13.5A14.5 14.5 0 0 0 9.6 30.3L8 40l9.9-2.6a14.5 14.5 0 0 0 6.9 1.8A14.5 14.5 0 0 0 34.5 13.5zm-9.7 22.3a12 12 0 0 1-6.1-1.7l-.4-.3-4.4 1.2 1.2-4.3-.3-.5a12 12 0 1 1 10 5.6zm6.6-9c-.4-.2-2.1-1-2.4-1.1-.3-.1-.5-.2-.7.2s-.8 1.1-1 1.3c-.2.2-.4.2-.7 0-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.2-2-2.5-.2-.3 0-.5.2-.6l.5-.6.3-.6.1-.6-.9-2.2c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.3.2-1.5-.1-.2-.3-.3-.7-.5z"/>
    </svg>
  );
}

function ApolloLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <circle cx="24" cy="24" r="20" fill="#171C3F"/>
      <path d="M24 10l4.5 9h9.5l-7.5 5.5 2.8 9.5L24 28l-9.3 6 2.8-9.5L10 19h9.5z" fill="#7C3AED"/>
    </svg>
  );
}

function ClearbitLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#1A56DB"/>
      <path d="M14 24a10 10 0 0 1 10-10v4a6 6 0 0 0-6 6 6 6 0 0 0 6 6v4a10 10 0 0 1-10-10z" fill="#fff"/>
      <circle cx="30" cy="20" r="4" fill="#fff"/>
    </svg>
  );
}

function PhantomBusterLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
      <rect width="48" height="48" rx="12" fill="#5B21B6"/>
      <path d="M24 10c-6 0-10 4-10 9 0 3 1.5 5.5 4 7v8l3-3 3 3 3-3 3 3v-8c2.5-1.5 4-4 4-7 0-5-4-9-10-9z" fill="#fff"/>
      <circle cx="20" cy="21" r="2" fill="#5B21B6"/>
      <circle cx="28" cy="21" r="2" fill="#5B21B6"/>
    </svg>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ConnStatus, { label: string; cls: string }> = {
  connected:    { label: "Connected",    cls: "bg-teal-50 text-teal-700 border border-teal-200" },
  disconnected: { label: "Not connected", cls: "bg-slate-100 text-slate-500" },
  coming_soon:  { label: "Coming soon",   cls: "bg-purple-50 text-purple-600" },
};

// Static catalog — display metadata only. Live status comes from integration-service.
const CATALOG: CatalogItem[] = [
  // Email
  { id: "google",        name: "Google Workspace",    description: "Connect Gmail for outreach and Google Calendar for meeting booking — one OAuth flow.", category: "email", extraCategories: ["calendar"], logo: <GoogleLogo />, comingSoon: false },
  { id: "microsoft365",  name: "Microsoft 365",        description: "Connect Outlook for email outreach and Calendar for meeting booking — one OAuth flow.", category: "email", extraCategories: ["calendar"], logo: <Microsoft365Logo />, comingSoon: false },
  { id: "smtp",          name: "Custom SMTP",          description: "Connect any SMTP server — Mailgun, SendGrid, Postmark, or your own.",   category: "email",         logo: <SmtpLogo />,          comingSoon: false },

  { id: "cal_com",       name: "Cal.com",              description: "Use your Cal.com scheduling link for meeting booking.",                 category: "calendar",      logo: <CalComLogo />,        comingSoon: true  },
  // CRM
  { id: "hubspot",       name: "HubSpot",              description: "Two-way sync leads, deals, and activities with HubSpot CRM.",          category: "crm",           logo: <HubSpotLogo />,       comingSoon: true  },
  { id: "salesforce",    name: "Salesforce",           description: "Push deals and contacts directly into Salesforce.",                    category: "crm",           logo: <SalesforceLogo />,    comingSoon: true  },
  { id: "pipedrive",     name: "Pipedrive",            description: "Sync deals and contacts with Pipedrive.",                              category: "crm",           logo: <PipedriveLogo />,     comingSoon: true  },
  // Communication
  { id: "slack",         name: "Slack",                description: "Receive real-time notifications for replies, meetings, and hot leads.", category: "communication", logo: <SlackLogo />,         comingSoon: false },
  { id: "zalo",          name: "Zalo (Vietnam)",        description: "Send outreach and follow-up messages via Zalo OA.",                   category: "communication", logo: <ZaloLogo />,          comingSoon: true  },
  { id: "whatsapp",      name: "WhatsApp Business",    description: "Reach leads on WhatsApp for Southeast Asia outreach.",                 category: "communication", logo: <WhatsAppLogo />,      comingSoon: true  },
  // Data
  { id: "apollo",        name: "Apollo.io",            description: "Import and enrich leads directly from Apollo's B2B database.",         category: "data",          logo: <ApolloLogo />,        comingSoon: true  },
  { id: "clearbit",      name: "Clearbit",             description: "Auto-enrich leads with company and contact intelligence.",             category: "data",          logo: <ClearbitLogo />,      comingSoon: true  },
  { id: "phantombuster", name: "PhantomBuster",        description: "Pull LinkedIn leads and profile data via PhantomBuster.",              category: "data",          logo: <PhantomBusterLogo />, comingSoon: true  },
];

// OAuth providers that redirect to a third-party auth page
const OAUTH_PROVIDERS_SET = new Set(["google", "microsoft365", "slack", "hubspot", "salesforce", "pipedrive"]);
// Providers that need a credentials form
const CREDENTIALS_PROVIDERS_SET = new Set(["smtp"]);

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<"all" | Category>("all");
  const [successBanner, setSuccessBanner] = useState(false);

  // Show success banner when redirected back from OAuth callback
  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setSuccessBanner(true);
      router.replace("/integrations", { scroll: false });
      const t = setTimeout(() => setSuccessBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  // Modal state
  const [oauthModal, setOauthModal] = useState<{ item: Integration } | null>(null);
  const [smtpModal, setSmtpModal] = useState<{ item: Integration } | null>(null);
  const [smtpForm, setSmtpForm] = useState({ host: "", port: "587", username: "", password: "" });
  const [disconnectConfirm, setDisconnectConfirm] = useState<{ item: Integration } | null>(null);

  const { data: liveIntegrations = [] } = useIntegrations();
  const connect = useConnectIntegration();
  const connectWithCreds = useConnectWithCredentials();
  const disconnect = useDisconnectIntegration();
  const { fetchOAuthUrl, isLoading: oauthLoading } = useOAuthUrl();

  const categories: ("all" | Category)[] = ["all", "email", "calendar", "crm", "communication", "data"];

  // Merge static catalog with live statuses from integration-service
  const liveMap = new Map(liveIntegrations.map((li) => [li.provider, li]));
  const integrations: Integration[] = CATALOG.map((item) => {
    if (item.comingSoon) return { ...item, status: "coming_soon" };
    const live = liveMap.get(item.id);
    return { ...item, status: live?.status === "active" ? "connected" : "disconnected", liveId: live?.id };
  });

  const filtered = activeCategory === "all"
    ? integrations
    : integrations.filter((i) => i.category === activeCategory || i.extraCategories?.includes(activeCategory));

  const connected = integrations.filter((i) => i.status === "connected");

  async function handleConnect(item: Integration) {
    if (OAUTH_PROVIDERS_SET.has(item.id)) {
      // Fetch OAuth URL then show modal
      const result = await fetchOAuthUrl(item.id);
      if (result.url) {
        // Real OAuth — redirect browser
        window.location.href = result.url;
      } else {
        // Dev mode — show modal to simulate
        setOauthModal({ item });
      }
    } else if (CREDENTIALS_PROVIDERS_SET.has(item.id)) {
      setSmtpForm({ host: "", port: "587", username: "", password: "" });
      setSmtpModal({ item });
    } else {
      connect.mutate(item.id);
    }
  }

  function handleDisconnect(item: Integration) {
    setDisconnectConfirm({ item });
  }

  function confirmDisconnect() {
    if (!disconnectConfirm?.item.liveId) {
      // No live record — already gone, just close
      setDisconnectConfirm(null);
      return;
    }
    disconnect.mutate(disconnectConfirm.item.liveId, {
      onSettled: () => setDisconnectConfirm(null),
    });
  }

  function submitSmtp() {
    if (!smtpModal) return;
    connectWithCreds.mutate(
      { provider: smtpModal.item.id, credentials: smtpForm },
      { onSuccess: () => setSmtpModal(null) },
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 py-5 max-w-4xl mx-auto space-y-5">
        {/* OAuth success banner */}
        {successBanner && (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="font-medium">Integration connected successfully!</span>
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Integrations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect your email, calendar, CRM, and communication tools.
            </p>
          </div>
          <div className="shrink-0">
            <span className="text-xs text-muted-foreground">{connected.length} connected</span>
          </div>
        </div>

        {/* Connected summary */}
        {connected.length > 0 && (
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active connections</h3>
            <div className="space-y-2">
              {connected.map((int) => (
                <div key={int.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    {int.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{int.name}</p>
                    {int.connectedAs && <p className="text-xs text-muted-foreground truncate">{int.connectedAs} · Connected {int.connectedAt}</p>}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline shrink-0"
                    onClick={() => handleDisconnect(int)}
                    disabled={disconnect.isPending}
                  >
                    {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All" : CAT_LABEL[cat]}
            </button>
          ))}
        </div>

        {/* Integration grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((int) => {
            const badge = STATUS_BADGE[int.status];
            const isConnecting = (connect.isPending && connect.variables === int.id) || oauthLoading;
            const isConnected = int.status === "connected";
            const isComingSoon = int.status === "coming_soon";
            return (
              <div
                key={int.id}
                className={`card p-4 flex gap-4 transition-shadow hover:shadow-md ${
                  isConnected ? "border-teal-200 bg-teal-50/30" : ""
                }`}
              >
                {/* Logo */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isComingSoon ? "bg-secondary opacity-60" : "bg-secondary"
                }`}>
                  {int.logo}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${isComingSoon ? "text-muted-foreground" : "text-foreground"}`}>
                      {int.name}
                    </p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{int.description}</p>

                  {/* CTA */}
                  <div className="mt-auto pt-1">
                    {isConnected ? (
                      <div className="flex items-center gap-3">
                        {int.connectedAs && (
                          <span className="text-xs text-muted-foreground truncate">{int.connectedAs}</span>
                        )}
                        <div className="ml-auto flex gap-2">
                          <button
                            type="button"
                            className="btn btn-ghost text-xs"
                            onClick={() => handleConnect(int)}
                            disabled={oauthLoading}
                          >
                            Configure
                          </button>
                          <button
                            type="button"
                            className="text-xs text-destructive hover:underline"
                            onClick={() => handleDisconnect(int)}
                            disabled={disconnect.isPending}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : isComingSoon ? (
                      <button type="button" disabled className="btn btn-secondary text-xs opacity-50 cursor-not-allowed">
                        Coming soon
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(int)}
                        disabled={isConnecting}
                        className="btn btn-primary text-xs px-4"
                      >
                        {isConnecting ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                            Connecting…
                          </span>
                        ) : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* API section */}
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">API & Webhooks</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Use the RevLooper API or receive webhook events for custom integrations.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">API Key</p>
                <button type="button" className="text-xs text-primary hover:underline">Regenerate</button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 font-mono text-muted-foreground truncate">
                  rl_live_••••••••••••••••••••••••
                </code>
                <button type="button" className="btn btn-ghost text-xs">Copy</button>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Webhook endpoint</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://your-server.com/webhook"
                  className="flex-1 text-xs border border-input rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" className="btn btn-secondary text-xs">Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── OAuth dev-mode modal ─────────────────────────────────── */}
      {oauthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                {oauthModal.item.logo}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Connect {oauthModal.item.name}</h2>
                <p className="text-xs text-muted-foreground">OAuth authorization required</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Development mode</p>
              <p>OAuth app credentials are not configured. In production, you would be redirected to {oauthModal.item.name} to authorize access.</p>
            </div>
            <p className="text-xs text-muted-foreground">
              To enable real OAuth, set <code className="bg-secondary px-1 rounded">{oauthModal.item.id.toUpperCase().replace("_", "")}_CLIENT_ID</code> and <code className="bg-secondary px-1 rounded">_CLIENT_SECRET</code> environment variables.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn btn-ghost text-xs flex-1"
                onClick={() => setOauthModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs flex-1"
                disabled={connect.isPending}
                onClick={() => {
                  connect.mutate(oauthModal.item.id, { onSuccess: () => setOauthModal(null) });
                }}
              >
                {connect.isPending ? "Simulating…" : "Simulate connection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMTP credentials modal ───────────────────────────────── */}
      {smtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                {smtpModal.item.logo}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Connect Custom SMTP</h2>
                <p className="text-xs text-muted-foreground">Enter your SMTP server credentials</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.example.com"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm((f) => ({ ...f, host: e.target.value }))}
                    className="w-full text-xs border border-input rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Port</label>
                  <input
                    type="text"
                    placeholder="587"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm((f) => ({ ...f, port: e.target.value }))}
                    className="w-full text-xs border border-input rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Username / Email</label>
                <input
                  type="text"
                  placeholder="you@example.com"
                  value={smtpForm.username}
                  onChange={(e) => setSmtpForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full text-xs border border-input rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Password</label>
                <input
                  type="password"
                  placeholder="App password or SMTP password"
                  value={smtpForm.password}
                  onChange={(e) => setSmtpForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full text-xs border border-input rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn btn-ghost text-xs flex-1" onClick={() => setSmtpModal(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary text-xs flex-1"
                disabled={connectWithCreds.isPending || !smtpForm.host || !smtpForm.username || !smtpForm.password}
                onClick={submitSmtp}
              >
                {connectWithCreds.isPending ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect confirm modal ─────────────────────────────── */}
      {disconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Disconnect {disconnectConfirm.item.name}?</h2>
            <p className="text-xs text-muted-foreground">
              This will remove the connection. Any campaigns using this account will pause until you reconnect.
            </p>
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn btn-ghost text-xs flex-1" onClick={() => setDisconnectConfirm(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-destructive text-xs flex-1"
                disabled={disconnect.isPending}
                onClick={confirmDisconnect}
              >
                {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
