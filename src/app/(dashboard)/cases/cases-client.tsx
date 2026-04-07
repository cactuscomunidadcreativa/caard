"use client";

/**
 * CAARD - Cases Client Component
 * Maneja traducciones y visualización de expedientes con datos reales del API
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n";
import type { CaseStatus } from "@prisma/client";

interface ArbitrationType {
  id: string;
  code: string;
  name: string;
}

interface CaseItem {
  id: string;
  code: string;
  title: string;
  status: CaseStatus;
  claimantName: string;
  respondentName: string;
  createdAt: string;
  arbitrationType: {
    code: string;
    name: string;
  };
  _count: {
    documents: number;
    payments: number;
  };
}

interface CasesResponse {
  items: CaseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <TableRow key={rowIdx}>
            {Array.from({ length: 8 }).map((_, colIdx) => (
              <TableCell key={colIdx}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CasesClient() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [arbitrationTypeId, setArbitrationTypeId] = useState("all");
  const [page, setPage] = useState(1);

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [arbitrationTypes, setArbitrationTypes] = useState<ArbitrationType[]>([]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  // Fetch arbitration types on mount
  useEffect(() => {
    async function fetchArbitrationTypes() {
      try {
        const res = await fetch("/api/arbitration-types");
        if (res.ok) {
          const data: ArbitrationType[] = await res.json();
          setArbitrationTypes(data);
        }
      } catch {
        // Silently fail - dropdown will just show "Todos"
      }
    }
    fetchArbitrationTypes();
  }, []);

  // Fetch cases when filters/page change
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (arbitrationTypeId !== "all") params.set("arbitrationTypeId", arbitrationTypeId);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/cases?${params.toString()}`);
      if (res.ok) {
        const data: CasesResponse = await res.json();
        setCases(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        setCases([]);
        setTotalPages(0);
        setTotal(0);
      }
    } catch {
      setCases([]);
      setTotalPages(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, arbitrationTypeId, page]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Reset page when filters change
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setArbitrationTypeId(value);
    setPage(1);
  };

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
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
            <Select value={arbitrationTypeId} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.cases.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                {arbitrationTypes.map((at) => (
                  <SelectItem key={at.id} value={at.id}>
                    {at.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : cases.length > 0 ? (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {cases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="group relative rounded-xl border-2 border-slate-200 bg-white p-5 hover:border-[#D66829] hover:shadow-lg transition-all duration-200"
                >
                  {/* Header with code and status */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#0B2A5B]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D66829]/10 transition-colors">
                          <svg className="w-4 h-4 text-[#0B2A5B] group-hover:text-[#D66829]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="font-bold text-sm text-[#0B2A5B] truncate">{caseItem.code}</p>
                      </div>
                    </div>
                    <CaseStatusBadge status={caseItem.status} />
                  </div>

                  {/* Title */}
                  <p className="text-sm text-slate-700 font-medium line-clamp-2 mb-3 min-h-[2.5rem]">
                    {caseItem.title}
                  </p>

                  {/* Parts */}
                  <div className="space-y-1.5 mb-3 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500 font-medium min-w-[80px]">Demandante:</span>
                      <span className="text-slate-700 line-clamp-1">{caseItem.claimantName || "—"}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500 font-medium min-w-[80px]">Demandado:</span>
                      <span className="text-slate-700 line-clamp-1">{caseItem.respondentName || "—"}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      {caseItem.arbitrationType?.name || "—"}
                    </span>
                    <span className="text-xs font-medium text-[#D66829] group-hover:underline">
                      Ver detalle →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

              {/* Pagination - sticky bottom for visibility */}
              {totalPages > 1 && (
                <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-[#0B2A5B]/10 bg-white/95 backdrop-blur px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-[#0B2A5B]">{total}</span> {t.cases.title.toLowerCase()} • Página <span className="font-bold text-[#0B2A5B]">{page}</span> de <span className="font-bold text-[#0B2A5B]">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={page <= 1}
                      className="border-2 border-[#0B2A5B]/20 hover:bg-[#0B2A5B] hover:text-white hover:border-[#0B2A5B] transition-all"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      {t.common.previous}
                    </Button>
                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        const isActive = pageNum === page;
                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setPage(pageNum);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={
                              isActive
                                ? "bg-[#D66829] hover:bg-[#c45a22] text-white min-w-[40px]"
                                : "border-2 border-[#0B2A5B]/20 hover:bg-[#0B2A5B] hover:text-white hover:border-[#0B2A5B] min-w-[40px]"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={page >= totalPages}
                      className="border-2 border-[#0B2A5B]/20 hover:bg-[#0B2A5B] hover:text-white hover:border-[#0B2A5B] transition-all"
                    >
                      {t.common.next}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-12">
            <EmptyState
              title={t.common.noResults}
              description={t.cases.title}
              action={{
                label: t.sidebar.newCase,
                onClick: () => {},
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
