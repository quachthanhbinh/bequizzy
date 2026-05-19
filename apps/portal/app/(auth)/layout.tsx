"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoMark } from "@/components/LogoMark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-teal-950 via-teal-900 to-teal-700 p-10 text-white">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <LogoMark size={36} />
          <span className="text-lg font-bold tracking-tight">RevLooper</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold mb-3 leading-snug">
            {t.brand.tagline}
          </h2>
          <p className="text-teal-100/65 mb-8 leading-relaxed text-sm">
            {t.brand.tagSub}
          </p>
          <ul className="space-y-3">
            {t.brand.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-teal-50/90">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400/30">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-l-2 border-white/20 pl-4">
          <p className="text-sm text-teal-100/65 italic leading-relaxed">{t.brand.quote}</p>
          <p className="text-xs text-teal-200/45 mt-1.5">{t.brand.quoteAuthor}</p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex flex-col bg-background">
        {/* Mobile header */}
        <div className="flex md:hidden items-center justify-between px-5 py-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              RL
            </span>
            <span className="text-sm font-bold text-foreground">RevLooper</span>
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Language toggle — desktop top-right */}
        <div className="hidden md:flex justify-end px-6 pt-5">
          <LanguageSwitcher />
        </div>

        {/* Content area */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 overflow-y-auto">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
