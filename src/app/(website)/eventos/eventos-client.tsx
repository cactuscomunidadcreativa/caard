"use client";

/**
 * CAARD - Eventos Client Component
 * Muestra eventos con traducciones y filtros
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ExternalLink,
  ChevronRight,
  CalendarDays,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/use-translation";

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  type: string;
  category: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  registrationUrl?: string | null;
  maxAttendees?: number | null;
  currentAttendees?: number;
  price: number | null;
  currency: string;
}

interface EventosClientProps {
  events: {
    upcoming: Event[];
    past: Event[];
  };
}

const eventTypeLabels: Record<string, { es: string; en: string }> = {
  CONFERENCE: { es: "Conferencia", en: "Conference" },
  WORKSHOP: { es: "Taller", en: "Workshop" },
  SEMINAR: { es: "Seminario", en: "Seminar" },
  WEBINAR: { es: "Webinar", en: "Webinar" },
  COURSE: { es: "Curso", en: "Course" },
  NETWORKING: { es: "Networking", en: "Networking" },
  OTHER: { es: "Evento", en: "Event" },
};

function formatDate(dateStr: string, locale: string = "es") {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number | null, currency: string) {
  if (!price) return null;
  const amount = price / 100;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

function EventCard({ event, locale, t }: { event: Event; locale: string; t: any }) {
  const typeLabel = eventTypeLabels[event.type]?.[locale as "es" | "en"] || event.type;
  const formattedPrice = formatPrice(event.price, event.currency);
  const spotsLeft = event.maxAttendees ? event.maxAttendees - (event.currentAttendees || 0) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {event.coverImage && (
        <div className="relative h-48 w-full">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-[#D66829]">{typeLabel}</Badge>
          </div>
          {event.isOnline && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                Online
              </Badge>
            </div>
          )}
        </div>
      )}
      {!event.coverImage && (
        <div className="h-48 w-full bg-gradient-to-br from-[#0B2A5B] to-[#D66829] flex items-center justify-center">
          <CalendarDays className="h-16 w-16 text-white/50" />
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/20">{typeLabel}</Badge>
          </div>
        </div>
      )}

      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Calendar className="h-4 w-4 text-[#D66829]" />
          <span>{formatDate(event.startDate, locale)}</span>
        </div>

        <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.title}</h3>

        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatTime(event.startDate)}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {spotsLeft !== null && spotsLeft > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{spotsLeft} {t.website.spotsAvailable || "cupos disponibles"}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {formattedPrice ? (
              <span className="font-bold text-[#D66829]">{formattedPrice}</span>
            ) : (
              <Badge variant="secondary">{t.website.freeEvent}</Badge>
            )}
          </div>

          {event.registrationUrl && (
            <Button size="sm" asChild>
              <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                {t.website.registerEvent}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EventosClient({ events }: EventosClientProps) {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [filterType, setFilterType] = useState<string | null>(null);

  // Obtener tipos únicos de eventos
  const allEvents = [...events.upcoming, ...events.past];
  const eventTypes = Array.from(new Set(allEvents.map((e) => e.type)));

  // Filtrar eventos por tipo
  const filteredUpcoming = filterType
    ? events.upcoming.filter((e) => e.type === filterType)
    : events.upcoming;
  const filteredPast = filterType
    ? events.past.filter((e) => e.type === filterType)
    : events.past;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <CalendarDays className="h-4 w-4" />
              {t.website.theCenter}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.eventsPageTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.eventsPageSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Filtros y contenido */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          {/* Filtros de tipo */}
          {eventTypes.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={filterType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(null)}
              >
                {t.website.allEvents}
              </Button>
              {eventTypes.map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {eventTypeLabels[type]?.[locale as "es" | "en"] || type}
                </Button>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="upcoming" className="gap-2">
                <Calendar className="h-4 w-4" />
                {t.website.upcomingEvents}
                {events.upcoming.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {events.upcoming.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <Clock className="h-4 w-4" />
                {t.website.pastEvents}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {filteredUpcoming.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpcoming.map((event) => (
                    <EventCard key={event.id} event={event} locale={locale} t={t} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t.website.noUpcomingEvents}
                    </h3>
                    <p className="text-muted-foreground">
                      {t.website.stayTuned}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past">
              {filteredPast.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPast.map((event) => (
                    <EventCard key={event.id} event={event} locale={locale} t={t} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t.website.noPastEvents}
                    </h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[6vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t.website.needMoreInfo}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t.website.visitServicesPages}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contacto">
                <Button>
                  {t.website.contactUs}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/registro-arbitros">
                <Button variant="outline">
                  {t.website.arbitratorRegistryPageTitle}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
