"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PortalHome() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="ghost" />
      </div>

      <div className="text-center max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur text-white text-lg font-bold shadow-lg">
            RL
          </span>
          <span className="text-2xl font-bold text-white tracking-tight">RevLooper</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {t.home.headline}
        </h1>
        <p className="text-lg text-teal-100/70 mb-10 leading-relaxed">{t.home.sub}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/sign-up"
            className="btn btn-lg bg-white text-teal-700 hover:bg-teal-50 border-white font-semibold shadow-lg"
          >
            {t.home.cta}
          </Link>
          <Link
            href="/sign-in"
            className="btn btn-lg bg-white/10 text-white border-white/25 hover:bg-white/20"
          >
            {t.home.signIn}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-teal-300/60">
          <span>{t.home.noCard}</span>
          <span>·</span>
          <span>{t.home.freePlan}</span>
          <span>·</span>
          <span>{t.home.setup}</span>
        </div>
      </div>

      <a
        href="https://revlooper.com"
        className="absolute bottom-6 text-xs text-teal-300/50 hover:text-teal-300/80 transition-colors"
      >
        ← revlooper.com
      </a>
    </div>
  );
}
