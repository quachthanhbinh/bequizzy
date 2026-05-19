"use client";

import { useState } from "react";

type ContentType = "copy" | "image" | "email" | "banner" | "sms";
type AssetStatus = "draft" | "ready" | "used";

interface Asset {
  id: string;
  name: string;
  type: ContentType;
  channel: string;
  preview: string;
  status: AssetStatus;
  createdAt: string;
  credits: number;
}

const TYPE_LABEL: Record<ContentType, string> = {
  copy: "Ad Copy", image: "Image", email: "Email", banner: "Banner", sms: "SMS",
};
const TYPE_COLOR: Record<ContentType, string> = {
  copy:   "bg-blue-100 text-blue-700",
  image:  "bg-purple-100 text-purple-700",
  email:  "bg-green-100 text-green-700",
  banner: "bg-orange-100 text-orange-700",
  sms:    "bg-yellow-100 text-yellow-700",
};
const STATUS_COLOR: Record<AssetStatus, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  ready: "bg-green-100 text-green-700",
  used:  "bg-gray-100 text-gray-600",
};

const ASSETS: Asset[] = [
  { id: "a1", name: "Q2 SaaS Cold Outreach — Ad Copy", type: "copy", channel: "Facebook", preview: "Struggling to book meetings? RevLooper automates your outreach so you can focus on closing.", status: "ready", createdAt: "2h ago", credits: 1 },
  { id: "a2", name: "Recruitment Campaign Social Post", type: "copy", channel: "LinkedIn", preview: "Hiring in Southeast Asia? Our AI finds and qualifies 100s of candidates daily. Here's how...", status: "used", createdAt: "1d ago", credits: 1 },
  { id: "a3", name: "Newsletter Intro — May 2025", type: "email", channel: "Email", preview: "Welcome back! This month we shipped lead scoring, new sequence templates, and more.", status: "draft", createdAt: "3d ago", credits: 2 },
  { id: "a4", name: "Zalo Broadcast — Promo Week", type: "copy", channel: "Zalo", preview: "Tuan nay RevLooper giam gia 30% cho goi Growth. Dang ky ngay hom nay!", status: "ready", createdAt: "5d ago", credits: 1 },
  { id: "a5", name: "LinkedIn Banner 1200x628", type: "banner", channel: "LinkedIn", preview: "[Banner: teal gradient + RevLooper logo + AI Sales Rep for SEA]", status: "ready", createdAt: "1w ago", credits: 5 },
  { id: "a6", name: "SMS Follow-up Template", type: "sms", channel: "SMS", preview: "Hi {name}, just checking in on our earlier conversation. Available for a quick call?", status: "used", createdAt: "2w ago", credits: 1 },
];

const STARTER_PACK = [
  { id: "sp1", title: "Ad Headlines x3", subtitle: "Attention-grabbing variants", credits: 1, preview: "Stop losing sales to manual follow-ups. RevLooper automates your outreach 24/7." },
  { id: "sp2", title: "Ad Headlines x3", subtitle: "Benefit-focused variants", credits: 1, preview: "Book 3x more meetings with AI-powered sequences. No extra headcount needed." },
  { id: "sp3", title: "Ad Headlines x3", subtitle: "Urgency-angle variants", credits: 1, preview: "Your competitors are already using AI outreach. Start your free trial today." },
  { id: "sp4", title: "Facebook / Zalo Social Post", subtitle: "Platform-optimised with hashtags", credits: 1, preview: "Growing a B2B business in Southeast Asia? Here is how we helped a solo founder book..." },
  { id: "sp5", title: "Email Newsletter Intro", subtitle: "Brand-consistent, AI Brain grounded", credits: 2, preview: "Welcome! This week we want to share how our customers are using RevLooper to..." },
];

const POWER_FUNCTIONS = [
  { id: 1, name: "Write Ad Copy", desc: "3 variants (attention, benefit, urgency)", credits: 1, icon: "✍️" },
  { id: 2, name: "Social Post", desc: "Platform-aware + hashtag suggestions", credits: 1, icon: "📱" },
  { id: 3, name: "Broadcast Message", desc: "Zalo / WhatsApp up to 1000 chars", credits: 1, icon: "📢" },
  { id: 4, name: "Email Newsletter", desc: "Full newsletter with intro, body, CTA", credits: 2, icon: "📧" },
  { id: 5, name: "Adapt for Channel", desc: "Reformat existing content for new channel", credits: 1, icon: "🔄" },
  { id: 6, name: "Translate", desc: "EN to VI to TH auto-detect", credits: 1, icon: "🌏" },
  { id: 7, name: "A/B Variants", desc: "2 distinct angle rewrites", credits: 1, icon: "⚗️" },
  { id: 8, name: "Generate Banner", desc: "HTML to PNG (5 templates)", credits: 5, icon: "🖼️" },
  { id: 9, name: "Generate Image", desc: "Free-form via Ideogram 2.0", credits: 8, icon: "🎨" },
  { id: 10, name: "Email Template", desc: "Reusable HTML shell + logo/footer", credits: 2, icon: "✉️" },
  { id: 11, name: "SMS Template", desc: "Up to 160 chars with merge fields", credits: 1, icon: "💬" },
  { id: 12, name: "Brochure / Flyer", desc: "PDF (A4) multi-section promo", credits: 10, icon: "📄" },
];

type Tab = "all" | ContentType;

const TABS: { id: Tab; label: string }[] = [
  { id: "all",    label: "All"     },
  { id: "copy",   label: "Copy"    },
  { id: "image",  label: "Images"  },
  { id: "email",  label: "Email"   },
  { id: "banner", label: "Banners" },
  { id: "sms",    label: "SMS"     },
];

export default function ContentStudioPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [showFunctions, setShowFunctions] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = tab === "all" ? ASSETS : ASSETS.filter((a) => a.type === tab);

  function handleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Content Studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated campaign content — grounded in your AI Brain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStarterPack((p) => !p)}
            className="btn btn-secondary text-sm"
          >
            ✨ Starter Pack
          </button>
          <button
            onClick={() => setShowFunctions((p) => !p)}
            className="btn btn-primary text-sm"
          >
            + Create Content
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Starter Pack */}
        {showStarterPack && (
          <div className="card p-5 border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="font-semibold text-foreground">✨ AI Starter Pack</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Generated from your campaign context + AI Brain. Save all for 8 credits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary text-sm">Re-run Starter Pack</button>
                <button className="btn btn-primary text-sm">Generate All &amp; Save — 8 credits</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STARTER_PACK.map((card) => (
                <div key={card.id} className="bg-background rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{card.title}</p>
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                    </div>
                    <span className="text-xs text-primary font-medium shrink-0">{card.credits} cr</span>
                  </div>
                  <p className="text-xs text-foreground/70 line-clamp-3 mb-3">{card.preview}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(card.id)}
                      className="btn btn-primary text-xs flex-1"
                    >
                      {saved.has(card.id) ? "✓ Saved" : "Create this"}
                    </button>
                    <button className="btn btn-secondary text-xs">Tweak</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Power Functions */}
        {showFunctions && (
          <div className="card p-5">
            <h2 className="font-semibold text-foreground mb-4">12 Power Functions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {POWER_FUNCTIONS.map((fn) => (
                <button
                  key={fn.id}
                  className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                >
                  <span className="text-xl">{fn.icon}</span>
                  <span className="text-sm font-medium text-foreground">{fn.name}</span>
                  <span className="text-xs text-muted-foreground">{fn.desc}</span>
                  <span className="text-xs text-primary font-medium mt-1">{fn.credits} cr</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Asset Library */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Asset Library</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} assets</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No assets in this category yet. Use the Create Content button to generate your first asset.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-foreground leading-tight">{asset.name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${STATUS_COLOR[asset.status]}`}>
                      {asset.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[asset.type]}`}>
                      {TYPE_LABEL[asset.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">{asset.channel}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{asset.createdAt}</span>
                  </div>
                  <p className="text-xs text-foreground/70 line-clamp-2 mb-3">{asset.preview}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button className="btn btn-secondary text-xs">Edit</button>
                      <button className="btn btn-secondary text-xs">Duplicate</button>
                    </div>
                    <button className="btn btn-primary text-xs">Use</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
