"use client";

import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
