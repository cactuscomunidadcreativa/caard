"use client";

/**
 * CAARD - Dashboard Client Component
 * Maneja traducciones y visualización del dashboard
 */

import {
  FileText,
  Clock,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import { ROLE_LABELS } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface DashboardClientProps {
  userName: string;
  userRole: keyof typeof ROLE_LABELS;
}

export function DashboardClient({ userName, userRole }: DashboardClientProps) {
  const { t } = useTranslation();

  // Stats cards data (mock - will be replaced with real data)
  const stats = [
    {
      title: t.dashboard.activeCases,
      value: "12",
      change: "+2 " + t.common.showMore.toLowerCase(),
      icon: FileText,
      href: "/cases?status=IN_PROCESS",
    },
    {
      title: t.dashboard.upcomingDeadlines,
      value: "3",
      change: t.cases.deadlines,
      icon: Clock,
      href: "/cases?deadlines=upcoming",
      urgent: true,
    },
    {
      title: t.dashboard.pendingPayments,
      value: "S/ 2,450.00",
      change: "2 " + t.payments.title.toLowerCase(),
      icon: CreditCard,
      href: "/payments?status=PENDING",
    },
    {
      title: t.cases.statusObserved,
      value: "1",
      change: t.dashboard.pendingTasks,
      icon: AlertTriangle,
      href: "/cases?status=OBSERVED",
      urgent: true,
    },
  ];

  // Recent cases (mock data)
  const recentCases = [
    {
      id: "1",
      code: "EXP-2026-CAARD-000123",
      title: "Incumplimiento contractual",
      status: "IN_PROCESS" as const,
      claimant: "Empresa ABC S.A.C.",
      respondent: "Constructora XYZ S.A.",
      updatedAt: "2h",
    },
    {
      id: "2",
      code: "EXP-2026-CAARD-000122",
      title: "Resolución de contrato",
      status: "UNDER_REVIEW" as const,
      claimant: "Juan Pérez García",
      respondent: "Inmobiliaria Sol S.A.",
      updatedAt: "5h",
    },
    {
      id: "3",
      code: "EXP-2026-CAARD-000121",
      title: "Cobro de deuda comercial",
      status: "OBSERVED" as const,
      claimant: "Comercializadora Norte S.A.C.",
      respondent: "Distribuidora Sur E.I.R.L.",
      updatedAt: "1d",
    },
  ];

  // Upcoming deadlines (mock data)
  const upcomingDeadlines = [
    {
      id: "1",
      caseCode: "EXP-2026-CAARD-000123",
      title: "Presentación de contestación",
      dueAt: "28 Ene 2026",
      daysLeft: 2,
    },
    {
      id: "2",
      caseCode: "EXP-2026-CAARD-000120",
      title: "Audiencia de pruebas",
      dueAt: "30 Ene 2026",
      daysLeft: 4,
    },
    {
      id: "3",
      caseCode: "EXP-2026-CAARD-000118",
      title: "Alegatos finales",
      dueAt: "02 Feb 2026",
      daysLeft: 7,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${t.dashboard.welcome}, ${userName}`}
        description={`${ROLE_LABELS[userRole]} • Dashboard CAARD`}
        action={{
          label: t.sidebar.newCase,
          href: "/cases/new",
          icon: Plus,
        }}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${
                  stat.urgent ? "text-destructive" : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
              <Link
                href={stat.href}
                className="absolute inset-0 rounded-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="sr-only">{t.common.view} {stat.title}</span>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent Cases */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cases">
                {t.common.showMore}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="font-medium hover:underline"
                      >
                        {caseItem.code}
                      </Link>
                      <CaseStatusBadge status={caseItem.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {caseItem.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {caseItem.claimant} vs. {caseItem.respondent}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {caseItem.updatedAt}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t.dashboard.upcomingDeadlines}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                {t.nav.calendar}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {deadline.caseCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={deadline.daysLeft <= 3 ? "destructive" : "secondary"}
                    >
                      {deadline.daysLeft} {deadline.daysLeft === 1 ? "día" : "días"}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {deadline.dueAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
