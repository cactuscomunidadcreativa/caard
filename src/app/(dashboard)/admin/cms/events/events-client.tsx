"use client";

/**
 * CAARD - Panel de Eventos (Client Component)
 * Con traducciones
 */

import { Calendar, Plus, MapPin, Globe, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import Link from "next/link";
import { CmsEventType } from "@prisma/client";

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

interface CmsEvent {
  id: string;
  title: string;
  type: CmsEventType;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  isOnline: boolean;
  isPublished: boolean;
  coverImage: string | null;
  price: number | null;
  maxAttendees: number | null;
  currentAttendees: number;
  category: { name: string; color: string | null } | null;
}

interface EventsClientProps {
  events: CmsEvent[];
  total: number;
  upcoming: number;
  published: number;
  online: number;
}

export function EventsClient({ events, total, upcoming, published, online }: EventsClientProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const dateLocale = locale === "es" ? es : enUS;

  const EVENT_TYPE_LABELS: Record<CmsEventType, string> = {
    WEBINAR: "Webinar",
    CONFERENCE: locale === "es" ? "Conferencia" : "Conference",
    WORKSHOP: locale === "es" ? "Taller" : "Workshop",
    COURSE: locale === "es" ? "Curso" : "Course",
    SEMINAR: locale === "es" ? "Seminario" : "Seminar",
    OTHER: locale === "es" ? "Otro" : "Other",
  };

  const EVENT_TYPE_COLORS: Record<CmsEventType, string> = {
    WEBINAR: "bg-blue-100 text-blue-700",
    CONFERENCE: "bg-purple-100 text-purple-700",
    WORKSHOP: "bg-green-100 text-green-700",
    COURSE: "bg-orange-100 text-orange-700",
    SEMINAR: "bg-pink-100 text-pink-700",
    OTHER: "bg-gray-100 text-gray-700",
  };

  const now = new Date();

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">{t.cms.eventsTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {total} {locale === "es" ? (total !== 1 ? "eventos" : "evento") : (total !== 1 ? "events" : "event")} {t.cms.total.toLowerCase()}
            </p>
          </div>
        </div>

        <Link href="/admin/cms/events/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            {t.cms.newEvent}
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
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.upcoming}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{upcoming}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.published}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">Online</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{online}</p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t.cms.eventsList}</CardTitle>
          <CardDescription className="text-sm">
            {locale === "es" ? "Conferencias, webinars, talleres y más" : "Conferences, webinars, workshops and more"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {events.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{t.cms.noEvents}</p>
              <p className="text-sm text-muted-foreground">{t.cms.createFirstEvent}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const isPast = new Date(event.startDate) < now;

                return (
                  <Card key={event.id} className={`overflow-hidden ${isPast ? "opacity-60" : ""}`}>
                    {event.coverImage && (
                      <div className="h-32 sm:h-40 bg-gray-100 overflow-hidden">
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={EVENT_TYPE_COLORS[event.type]}>
                          {EVENT_TYPE_LABELS[event.type]}
                        </Badge>
                        {event.isOnline ? (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {locale === "es" ? "Presencial" : "In-person"}
                          </Badge>
                        )}
                        {!event.isPublished && (
                          <Badge variant="secondary" className="text-xs">{t.cms.draft}</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {format(event.startDate, "dd MMM yyyy, HH:mm", { locale: dateLocale })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.maxAttendees && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span>{event.currentAttendees}/{event.maxAttendees} {locale === "es" ? "inscritos" : "registered"}</span>
                          </div>
                        )}
                      </div>

                      {event.price && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-lg font-bold text-[#D66829]">
                            S/ {(event.price / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
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
