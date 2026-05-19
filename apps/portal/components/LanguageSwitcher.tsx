"use client";

import { useLanguage, type Locale } from "@/lib/i18n";

const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "vi", label: "VI" },
];

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "ghost" }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg p-0.5 ${
        variant === "ghost" ? "bg-white/10" : "bg-secondary border border-border"
      }`}
    >
      {LOCALES.map(({ id, label }) => {
        const active = locale === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setLocale(id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              active
                ? variant === "ghost"
                  ? "bg-white/20 text-white"
                  : "bg-primary text-primary-foreground shadow-sm"
                : variant === "ghost"
                ? "text-white/60 hover:text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={active}
            aria-label={`Switch to ${id === "en" ? "English" : "Vietnamese"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
