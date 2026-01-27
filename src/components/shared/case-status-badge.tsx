"use client";

/**
 * CAARD - Badge de estado de expediente
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@prisma/client";
import { CASE_STATUS_LABELS } from "@/types";

const statusStyles: Record<CaseStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground hover:bg-muted/80",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100/80",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100/80",
  OBSERVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100/80",
  ADMITTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100/80",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100/80",
  IN_PROCESS: "bg-primary/10 text-primary hover:bg-primary/20",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100/80",
  PAYMENT_OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100/80",
  SUSPENDED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100/80",
  CLOSED: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200/80",
  ARCHIVED: "bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400 hover:bg-gray-300/80",
  EMERGENCY_REQUESTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100/80",
  EMERGENCY_IN_PROCESS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100/80",
  EMERGENCY_RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100/80",
  EMERGENCY_EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100/80",
};

interface CaseStatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {CASE_STATUS_LABELS[status]}
    </Badge>
  );
}
