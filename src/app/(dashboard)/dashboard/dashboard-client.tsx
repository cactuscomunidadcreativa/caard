"use client";

/**
 * CAARD - Dashboard Client Component
 * Maneja traducciones y visualización del dashboard con datos reales
 */

import { useEffect, useState, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import { ROLE_LABELS } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface DashboardClientProps {
  userName: string;
  userRole: keyof typeof ROLE_LABELS;
}

interface CaseItem {
  id: string;
  code: string;
  title: string;
  status: string;
  claimantName: string;
  respondentName: string;
  createdAt: string;
  arbitrationType?: {
    code: string;
    name: string;
  };
}

interface DeadlineItem {
  id: string;
  title: string;
  dueAt: string;
  daysRemaining: number;
  isOverdue: boolean;
  case: {
    id: string;
    code: string;
    title: string;
    status: string;
  };
}

interface PaymentStats {
  PENDING?: { count: number; amount: number };
  REQUIRED?: { count: number; amount: number };
  [key: string]: { count: number; amount: number } | undefined;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amountCents: number): string {
  return `S/ ${(amountCents / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
  })}`;
}

export function DashboardClient({ userName, userRole }: DashboardClientProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [totalCases, setTotalCases] = useState(0);
  const [recentCases, setRecentCases] = useState<CaseItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [deadlineCount, setDeadlineCount] = useState(0);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [observedCount, setObservedCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [casesRes, totalRes, observedRes, deadlinesRes, paymentsRes] =
        await Promise.allSettled([
          fetch("/api/cases?status=IN_PROCESS&pageSize=5"),
          fetch("/api/cases?pageSize=1"),
          fetch("/api/cases?status=OBSERVED&pageSize=1"),
          fetch("/api/deadlines?upcoming=true"),
          fetch("/api/payments?status=PENDING"),
        ]);

      // Recent cases (IN_PROCESS)
      if (casesRes.status === "fulfilled" && casesRes.value.ok) {
        const data = await casesRes.value.json();
        setRecentCases(data.items || []);
      }

      // Total cases count
      if (totalRes.status === "fulfilled" && totalRes.value.ok) {
        const data = await totalRes.value.json();
        setTotalCases(data.total || 0);
      }

      // Observed cases count
      if (observedRes.status === "fulfilled" && observedRes.value.ok) {
        const data = await observedRes.value.json();
        setObservedCount(data.total || 0);
      }

      // Deadlines
      if (deadlinesRes.status === "fulfilled" && deadlinesRes.value.ok) {
        const data = await deadlinesRes.value.json();
        setDeadlines(data.data || []);
        setDeadlineCount(data.pagination?.total || 0);
      }

      // Payments
      if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
        const data = await paymentsRes.value.json();
        const stats: PaymentStats = data.stats || {};
        const pendingStats = stats.PENDING || stats.REQUIRED;
        setPendingPaymentAmount(pendingStats?.amount || 0);
        setPendingPaymentCount(pendingStats?.count || data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Stats cards data
  const stats = [
    {
      title: t.dashboard.activeCases,
      value: loading ? null : String(totalCases),
      change: loading ? "" : `${totalCases} ${t.cases.title.toLowerCase()}`,
      icon: FileText,
      href: "/cases?status=IN_PROCESS",
    },
    {
      title: t.dashboard.upcomingDeadlines,
      value: loading ? null : String(deadlineCount),
      change: loading ? "" : t.cases.deadlines,
      icon: Clock,
      href: "/cases?deadlines=upcoming",
      urgent: deadlineCount > 0,
    },
    {
      title: t.dashboard.pendingPayments,
      value: loading ? null : formatCurrency(pendingPaymentAmount),
      change: loading
        ? ""
        : `${pendingPaymentCount} ${t.payments.title.toLowerCase()}`,
      icon: CreditCard,
      href: "/payments?status=PENDING",
    },
    {
      title: t.cases.statusObserved,
      value: loading ? null : String(observedCount),
      change: loading ? "" : t.dashboard.pendingTasks,
      icon: AlertTriangle,
      href: "/cases?status=OBSERVED",
      urgent: observedCount > 0,
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

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={fetchDashboardData}
          >
            Reintentar
          </Button>
        </div>
      )}

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
              {stat.value === null ? (
                <>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </>
              )}
              <Link
                href={stat.href}
                className="absolute inset-0 rounded-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="sr-only">
                  {t.common.view} {stat.title}
                </span>
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
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                ))
              ) : recentCases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay expedientes recientes
                </p>
              ) : (
                recentCases.map((caseItem) => (
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
                        <CaseStatusBadge status={caseItem.status as any} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {caseItem.claimantName} vs. {caseItem.respondentName}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {formatDate(caseItem.createdAt)}
                    </div>
                  </div>
                ))
              )}
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
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))
              ) : deadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay plazos próximos
                </p>
              ) : (
                deadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {deadline.case.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          deadline.isOverdue || deadline.daysRemaining <= 3
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {deadline.isOverdue
                          ? "Vencido"
                          : `${deadline.daysRemaining} ${
                              deadline.daysRemaining === 1 ? "día" : "días"
                            }`}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(deadline.dueAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
