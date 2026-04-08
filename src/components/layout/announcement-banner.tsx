"use client";
/**
 * Banner de anuncios activos del CMS que se muestra en el dashboard
 * cuando showOnAllPages=true.
 */
import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  type: "INFO" | "WARNING" | "ALERT" | "SUCCESS" | string;
  title: string;
  content?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  dismissable: boolean;
  showOnAllPages: boolean;
  showAsBanner: boolean;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/cms/announcements?active=true")
      .then((r) => r.json())
      .then((data: Announcement[]) => {
        if (Array.isArray(data)) {
          setAnnouncements(
            data.filter((a) => a.showOnAllPages && a.showAsBanner)
          );
        }
      })
      .catch(() => {});
    try {
      const raw = localStorage.getItem("dismissed-announcements");
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem("dismissed-announcements", JSON.stringify([...next]));
    } catch {}
  };

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {visible.map((a) => {
        const icon =
          a.type === "ALERT" ? (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          ) : a.type === "WARNING" ? (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Info className="h-4 w-4 flex-shrink-0" />
          );
        const bg =
          a.backgroundColor ||
          (a.type === "ALERT"
            ? "#FEE2E2"
            : a.type === "WARNING"
            ? "#FEF3C7"
            : "#DBEAFE");
        const tc =
          a.textColor ||
          (a.type === "ALERT"
            ? "#991B1B"
            : a.type === "WARNING"
            ? "#92400E"
            : "#1E40AF");
        return (
          <div
            key={a.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-md border"
            style={{ backgroundColor: bg, color: tc, borderColor: tc + "30" }}
          >
            {icon}
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-semibold">{a.title}</span>
              {a.content && <span className="ml-2 opacity-90">{a.content}</span>}
              {a.linkUrl && (
                <a
                  href={a.linkUrl}
                  className="ml-2 underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {a.linkText || "Más información"}
                </a>
              )}
            </div>
            {a.dismissable && (
              <button
                onClick={() => dismiss(a.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
