"use client";

/**
 * CAARD - Panel de Avisos/Anuncios (Client Component)
 * Con traducciones
 */

import { Megaphone, Plus, AlertCircle, Info, CheckCircle, AlertTriangle, Newspaper, ExternalLink, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import Link from "next/link";
import { CmsAnnouncementType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation, useI18n } from "@/lib/i18n";

interface CmsAnnouncement {
  id: string;
  title: string;
  content: string | null;
  type: CmsAnnouncementType;
  isActive: boolean;
  showOnHomepage: boolean;
  showOnAllPages: boolean;
  showAsBanner: boolean;
  showAsPopup: boolean;
  startDate: Date;
  endDate: Date | null;
  linkUrl: string | null;
  linkText: string | null;
  sortOrder: number;
}

interface AnnouncementsClientProps {
  announcements: CmsAnnouncement[];
  total: number;
  active: number;
  onHomepage: number;
  asBanner: number;
}

export function AnnouncementsClient({ announcements, total, active, onHomepage, asBanner }: AnnouncementsClientProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const dateLocale = locale === "es" ? es : enUS;

  const ANNOUNCEMENT_TYPE_LABELS: Record<CmsAnnouncementType, string> = {
    INFO: locale === "es" ? "Información" : "Information",
    WARNING: locale === "es" ? "Advertencia" : "Warning",
    SUCCESS: locale === "es" ? "Éxito" : "Success",
    ERROR: "Error",
    NEWS: locale === "es" ? "Noticia" : "News",
  };

  const ANNOUNCEMENT_TYPE_ICONS: Record<CmsAnnouncementType, any> = {
    INFO: Info,
    WARNING: AlertTriangle,
    SUCCESS: CheckCircle,
    ERROR: AlertCircle,
    NEWS: Newspaper,
  };

  const ANNOUNCEMENT_TYPE_COLORS: Record<CmsAnnouncementType, string> = {
    INFO: "bg-blue-100 text-blue-700 border-blue-200",
    WARNING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    SUCCESS: "bg-green-100 text-green-700 border-green-200",
    ERROR: "bg-red-100 text-red-700 border-red-200",
    NEWS: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const now = new Date();

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">{t.cms.announcementsTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {total} {locale === "es" ? (total !== 1 ? "avisos" : "aviso") : (total !== 1 ? "announcements" : "announcement")} {t.cms.total.toLowerCase()}
            </p>
          </div>
        </div>

        <Link href="/admin/cms/announcements/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            {t.cms.newAnnouncement}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.total}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.active}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{locale === "es" ? "En Inicio" : "On Homepage"}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{onHomepage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Banners</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{asBanner}</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t.cms.announcementsList}</CardTitle>
          <CardDescription className="text-sm">
            {locale === "es" ? "Anuncios, alertas y noticias del sitio" : "Site announcements, alerts and news"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {announcements.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Megaphone className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{t.cms.noAnnouncements}</p>
              <p className="text-sm text-muted-foreground">{t.cms.createFirstAnnouncement}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const Icon = ANNOUNCEMENT_TYPE_ICONS[announcement.type];
                const isExpired = announcement.endDate && new Date(announcement.endDate) < now;
                const isActive = announcement.isActive && !isExpired;

                return (
                  <Card
                    key={announcement.id}
                    className={`border-l-4 ${ANNOUNCEMENT_TYPE_COLORS[announcement.type]} ${
                      !isActive ? "opacity-60" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Icon and Content */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${ANNOUNCEMENT_TYPE_COLORS[announcement.type]} flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge className={ANNOUNCEMENT_TYPE_COLORS[announcement.type]}>
                                {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                              </Badge>
                              {!isActive && (
                                <Badge variant="secondary">
                                  {isExpired ? (locale === "es" ? "Expirado" : "Expired") : t.cms.inactive}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg">{announcement.title}</h3>
                            {announcement.content && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {announcement.content}
                              </p>
                            )}
                            {announcement.linkUrl && (
                              <a
                                href={announcement.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-[#D66829] hover:underline mt-2"
                              >
                                {announcement.linkText || (locale === "es" ? "Ver más" : "See more")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Metadata and Controls */}
                        <div className="flex flex-col sm:items-end gap-2 sm:gap-3 text-sm">
                          <Link href={`/admin/cms/announcements/${announcement.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Pencil className="h-4 w-4" />
                              {locale === "es" ? "Editar" : "Edit"}
                            </Button>
                          </Link>
                          <div className="flex flex-wrap gap-2">
                            {announcement.showOnHomepage && (
                              <Badge variant="outline" className="text-xs">{locale === "es" ? "Inicio" : "Home"}</Badge>
                            )}
                            {announcement.showOnAllPages && (
                              <Badge variant="outline" className="text-xs">{locale === "es" ? "Todas" : "All"}</Badge>
                            )}
                            {announcement.showAsBanner && (
                              <Badge variant="outline" className="text-xs">Banner</Badge>
                            )}
                            {announcement.showAsPopup && (
                              <Badge variant="outline" className="text-xs">Popup</Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs sm:text-sm">
                            <div>{locale === "es" ? "Desde" : "From"}: {format(announcement.startDate, "dd/MM/yyyy", { locale: dateLocale })}</div>
                            {announcement.endDate && (
                              <div>{locale === "es" ? "Hasta" : "Until"}: {format(announcement.endDate, "dd/MM/yyyy", { locale: dateLocale })}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
