"use client";

/**
 * CAARD - Cases Client Component
 * Maneja traducciones y visualización de expedientes
 */

import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n";

// Mock data - will be replaced with real data from API
const cases = [
  {
    id: "1",
    code: "EXP-2026-CAARD-000123",
    title: "Incumplimiento contractual",
    status: "IN_PROCESS" as const,
    arbitrationType: "Comercial",
    claimantName: "Empresa ABC S.A.C.",
    respondentName: "Constructora XYZ S.A.",
    submittedAt: "15 Ene 2026",
    updatedAt: "2h",
  },
  {
    id: "2",
    code: "EXP-2026-CAARD-000122",
    title: "Resolución de contrato",
    status: "UNDER_REVIEW" as const,
    arbitrationType: "Comercial",
    claimantName: "Juan Pérez García",
    respondentName: "Inmobiliaria Sol S.A.",
    submittedAt: "14 Ene 2026",
    updatedAt: "5h",
  },
  {
    id: "3",
    code: "EXP-2026-CAARD-000121",
    title: "Cobro de deuda comercial",
    status: "OBSERVED" as const,
    arbitrationType: "Comercial",
    claimantName: "Comercializadora Norte S.A.C.",
    respondentName: "Distribuidora Sur E.I.R.L.",
    submittedAt: "12 Ene 2026",
    updatedAt: "1d",
  },
  {
    id: "4",
    code: "EXP-2026-CAARD-000120",
    title: "Controversia en contrato de construcción",
    status: "ADMITTED" as const,
    arbitrationType: "Construcción",
    claimantName: "Corporación Delta S.A.",
    respondentName: "Constructora Omega S.A.C.",
    submittedAt: "10 Ene 2026",
    updatedAt: "2d",
  },
  {
    id: "5",
    code: "EXP-2025-CAARD-000119",
    title: "Indemnización por daños",
    status: "CLOSED" as const,
    arbitrationType: "Comercial",
    claimantName: "María López Torres",
    respondentName: "Seguros Pacífico S.A.",
    submittedAt: "20 Dic 2025",
    updatedAt: "1w",
  },
];

export function CasesClient() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.cases.title}
        description={t.cases.description || ""}
        action={{
          label: t.sidebar.newCase,
          href: "/cases/new",
          icon: Plus,
        }}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.common.filter}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t.common.search}...`}
                className="pl-8"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.cases.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="SUBMITTED">{t.cases.statusSubmitted}</SelectItem>
                <SelectItem value="UNDER_REVIEW">{t.cases.statusUnderReview}</SelectItem>
                <SelectItem value="OBSERVED">{t.cases.statusObserved}</SelectItem>
                <SelectItem value="ADMITTED">{t.cases.statusAdmitted}</SelectItem>
                <SelectItem value="IN_PROCESS">{t.cases.statusInProcess}</SelectItem>
                <SelectItem value="CLOSED">{t.cases.statusClosed}</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.cases.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="construccion">Construcción</SelectItem>
                <SelectItem value="emergencia">{t.sidebar.emergencies}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardContent className="p-0">
          {cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.cases.caseNumber}</TableHead>
                  <TableHead>{t.cases.caseTitle}</TableHead>
                  <TableHead>{t.cases.status}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t.cases.type}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.cases.claimant}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t.cases.respondent}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t.cases.createdAt}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell>
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {caseItem.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1">{caseItem.title}</span>
                    </TableCell>
                    <TableCell>
                      <CaseStatusBadge status={caseItem.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {caseItem.arbitrationType}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="line-clamp-1">{caseItem.claimantName}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="line-clamp-1">{caseItem.respondentName}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {caseItem.submittedAt}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/cases/${caseItem.id}`}>
                              {t.common.view} {t.cases.title.toLowerCase()}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/cases/${caseItem.id}/documents`}>
                              {t.common.view} {t.documents.title.toLowerCase()}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/cases/${caseItem.id}/payments`}>
                              {t.common.view} {t.payments.title.toLowerCase()}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={t.common.noResults}
              description={t.cases.title}
              action={{
                label: t.sidebar.newCase,
                onClick: () => {},
              }}
              className="m-6"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
