"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function OnboardingPage() {
  const { t } = useLanguage();
  const o = t.onboarding;

  const STEPS = [
    { id: "ai-brain", icon: "🧠", title: o.steps.aiBrain.title, description: o.steps.aiBrain.desc, cta: o.steps.aiBrain.cta, href: "/ai-brain",              time: o.steps.aiBrain.time  },
    { id: "leads",    icon: "👥", title: o.steps.leads.title,   description: o.steps.leads.desc,   cta: o.steps.leads.cta,   href: "/leads/import",          time: o.steps.leads.time    },
    { id: "campaign", icon: "⚡", title: o.steps.campaign.title,description: o.steps.campaign.desc,cta: o.steps.campaign.cta,href: "/campaigns/new",          time: o.steps.campaign.time },
    { id: "email",    icon: "✉️", title: o.steps.email.title,   description: o.steps.email.desc,   cta: o.steps.email.cta,   href: "/settings?tab=integrations", time: o.steps.email.time },
  ];

  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCompleted((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const progress = Math.round((completed.size / STEPS.length) * 100);

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">👋</span>
          <h1 className="text-2xl font-bold text-foreground">{o.title}</h1>
        </div>
        <p className="text-muted-foreground">{o.subtitle}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-foreground">
            {completed.size} / {STEPS.length} {o.progress}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const done = completed.has(step.id);
          return (
            <div
              key={step.id}
              className={`card p-5 transition-all ${done ? "opacity-60" : "hover:shadow-sm"}`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggle(step.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary/60"
                  }`}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-1">
                    <span className="text-xl leading-none">{step.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-medium">Step {index + 1}</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          ~{step.time}
                        </span>
                      </div>
                      <h3 className={`font-semibold text-foreground mt-0.5 ${done ? "line-through decoration-muted-foreground/50" : ""}`}>
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed ml-9">{step.description}</p>
                  {!done && (
                    <div className="mt-3 ml-9">
                      <Link href={step.href} className="btn btn-sm btn-primary">{step.cta}</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          You can always come back to this checklist from the dashboard.
        </p>
        <Link href="/dashboard" className="btn btn-outline btn-sm whitespace-nowrap">
          {o.skip}
        </Link>
      </div>
    </div>
  );
}
