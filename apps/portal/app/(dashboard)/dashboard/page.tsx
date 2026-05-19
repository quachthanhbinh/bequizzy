"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useLeads } from "@/hooks/useLeads";
import { useCampaigns } from "@/hooks/useCampaigns";

function StatIcon({ name }: { name: string }) {
  const cls = "h-5 w-5 text-muted-foreground";
  switch (name) {
    case "megaphone": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>;
    case "users":     return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case "mail":      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
    case "reply":     return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
    case "calendar":  return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
    default:          return null;
  }
}

function ActionIcon({ name }: { name: string }) {
  const cls = "h-6 w-6 text-primary";
  switch (name) {
    case "bolt":     return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
    case "users":    return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case "brain":    return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>;
    case "calendar": return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
    default:         return null;
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const d = t.dashboard;
  const { data: leadsData } = useLeads();
  const { data: campaignsData } = useCampaigns();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening;
  const firstName = user?.firstName ?? "there";

  const totalLeads = leadsData?.total ?? leadsData?.items?.length ?? 0;
  const totalCampaigns = campaignsData?.total ?? campaignsData?.items?.length ?? 0;

  const STATS = [
    { label: d.stats.activeCampaigns, value: totalCampaigns.toString(), icon: "megaphone", hint: d.stats.activeCampaignsHint },
    { label: d.stats.leads,           value: totalLeads.toString(),     icon: "users",     hint: d.stats.leadsHint },
    { label: d.stats.emailsSent,      value: "—",                      icon: "mail",      hint: d.stats.emailsSentHint },
    { label: d.stats.replies,         value: "—",                      icon: "reply",     hint: d.stats.repliesHint },
    { label: d.stats.meetings,        value: "—",                      icon: "calendar",  hint: d.stats.meetingsHint },
  ];

  const QUICK_ACTIONS = [
    { href: "/campaigns/new", icon: "bolt",     label: d.actions.newCampaign,    desc: d.actions.newCampaignDesc },
    { href: "/leads",         icon: "users",    label: d.actions.importLeads,    desc: d.actions.importLeadsDesc },
    { href: "/ai-brain",      icon: "brain",    label: d.actions.trainAI,        desc: d.actions.trainAIDesc, badge: d.recommended },
    { href: "/meetings",      icon: "calendar", label: d.actions.bookMeetings,   desc: d.actions.bookMeetingsDesc },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{d.subtitle}</p>
          </div>
          <Link href="/onboarding" className="btn btn-outline btn-sm gap-1.5 hidden sm:flex">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {d.setupGuide}
          </Link>
        </div>

        {/* Stats */}
        <div data-tour="dashboard-stats" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <StatIcon name={stat.icon} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <div>
                <p className="text-xs font-medium text-foreground">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">{d.quickActions}</h2>
          <div data-tour="dashboard-quick-actions" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="card p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ActionIcon name={action.icon} />
                  </div>
                  {action.badge && (
                    <span className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Lower section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Activity feed */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">{d.recentActivity}</h2>
              <span className="text-xs text-muted-foreground">{d.last7Days}</span>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground/50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{d.noActivity}</p>
              <p className="text-xs text-muted-foreground mb-3">{d.noActivityDesc}</p>
              <Link href="/campaigns/new" className="btn btn-sm btn-primary">
                {d.launchCampaign}
              </Link>
            </div>
          </div>

          {/* Daily ops brief */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">{d.dailyBrief}</h2>
              <span className="rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold px-2 py-0.5 border border-border">
                Pro
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary/60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{d.aiSummaryTitle}</p>
              <p className="text-xs text-muted-foreground mb-3">{d.aiSummaryDesc}</p>
              <Link href="/billing" className="btn btn-sm btn-outline">
                {d.upgradePro}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
