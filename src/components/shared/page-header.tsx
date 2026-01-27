/**
 * CAARD - Page header component
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {action && (
          <Button onClick={action.onClick} asChild={!!action.href}>
            {action.href ? (
              <a href={action.href}>
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </a>
            ) : (
              <>
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
