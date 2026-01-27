"use client";

/**
 * CAARD - Providers wrapper
 * Nota: SidebarProvider se usa solo en el dashboard, no globalmente
 */

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <I18nProvider>
        {children}
        <Toaster position="top-right" richColors />
      </I18nProvider>
    </SessionProvider>
  );
}
