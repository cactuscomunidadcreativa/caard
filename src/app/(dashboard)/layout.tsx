/**
 * CAARD - Dashboard Layout
 * Layout principal para usuarios autenticados
 * Incluye SidebarProvider solo para el dashboard (no globalmente)
 */

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";
import { FloatingChat } from "@/components/ai/floating-chat";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
      <FloatingChat />
    </SidebarProvider>
  );
}
