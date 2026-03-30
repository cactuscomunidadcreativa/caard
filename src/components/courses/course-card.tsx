"use client";

/**
 * CAARD - Course Card
 * Card component for the public course catalog.
 */

import Image from "next/image";
import Link from "next/link";
import { Clock, User, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CourseCardData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  modality: "ONLINE" | "PRESENCIAL" | "HYBRID";
  isFree: boolean;
  priceCents: number | null;
  currency: string;
  instructorName: string | null;
  durationHours: number | null;
}

const modalityLabels: Record<string, string> = {
  ONLINE: "Online",
  PRESENCIAL: "Presencial",
  HYBRID: "Híbrido",
};

const modalityColors: Record<string, string> = {
  ONLINE: "bg-blue-500",
  PRESENCIAL: "bg-green-600",
  HYBRID: "bg-purple-600",
};

function formatPrice(cents: number | null, currency: string) {
  if (!cents) return null;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const priceDisplay = formatPrice(course.priceCents, course.currency);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group py-0">
      {/* Cover image */}
      <div className="relative h-48 w-full">
        {course.coverImage ? (
          <Image
            src={course.coverImage}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0B2A5B] to-[#0B2A5B]/70 flex items-center justify-center">
            <GraduationCap className="h-16 w-16 text-white/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            className={`${modalityColors[course.modality] ?? "bg-gray-600"} text-white border-0`}
          >
            {modalityLabels[course.modality] ?? course.modality}
          </Badge>
        </div>
        {course.isFree && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-emerald-600 text-white border-0">
              Gratuito
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-3">
        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-[#0B2A5B] transition-colors">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="space-y-1.5 text-sm text-muted-foreground">
          {course.instructorName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#D66829]" />
              <span>{course.instructorName}</span>
            </div>
          )}
          {course.durationHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D66829]" />
              <span>{course.durationHours}h de contenido</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            {course.isFree ? (
              <span className="font-bold text-emerald-600">Gratuito</span>
            ) : priceDisplay ? (
              <span className="font-bold text-[#D66829]">{priceDisplay}</span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/cursos/${course.slug}`}>Ver más</Link>
            </Button>
            <Button size="sm" className="bg-[#0B2A5B] hover:bg-[#0B2A5B]/90" asChild>
              <Link href={`/cursos/${course.slug}`}>Inscribirse</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
