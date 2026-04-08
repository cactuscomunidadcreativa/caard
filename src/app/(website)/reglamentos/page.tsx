/**
 * CAARD - Página pública de Reglamentos
 * Lee los documentos normativos desde CMS (CmsSection type=CARDS en la página
 * "arbitraje/reglamentos") y los renderiza con opciones Ver y Descargar.
 */

import { Metadata } from "next";
import Link from "next/link";
import { FileText, Download, Eye, Calendar, Shield, Scale } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reglamentos - CAARD",
  description:
    "Descargue los reglamentos de arbitraje, aranceles, código de ética y normativas oficiales de CAARD.",
};

interface RegulationItem {
  title: string;
  description?: string;
  version?: string;
  effectiveDate?: string;
  fileUrl?: string;
  fileType?: string;
  category?: string;
  isActive?: boolean;
}

async function getRegulations(): Promise<RegulationItem[]> {
  try {
    const page = await prisma.cmsPage.findFirst({
      where: { slug: { in: ["arbitraje/reglamentos", "reglamentos"] } },
      include: {
        sections: {
          where: { type: "CARDS", isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!page) return [];
    const items: RegulationItem[] = [];
    for (const s of page.sections) {
      const c: any = s.content || {};
      const arr = c.items || c.cards || c.documents || [];
      if (Array.isArray(arr)) {
        for (const it of arr) {
          if (it && it.title && it.isActive !== false) items.push(it);
        }
      }
    }
    return items;
  } catch {
    return [];
  }
}

export default async function ReglamentosPage() {
  const regulations = await getRegulations();

  return (
    <>
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <FileText className="h-4 w-4" />
              Documentos Normativos
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Reglamentos y Normativa
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Consulte y descargue los reglamentos oficiales que rigen los
              procesos arbitrales administrados por CAARD.
            </p>
          </div>
        </div>
      </section>

      <section className="py-[8vh] md:py-[10vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-5">
            {regulations.length === 0 ? (
              <Card className="border-0 shadow-lg p-10 text-center text-slate-600">
                <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-lg font-medium">
                  No hay reglamentos disponibles en este momento.
                </p>
                <p className="text-sm mt-1">
                  Los documentos normativos serán publicados próximamente.
                </p>
              </Card>
            ) : (
              regulations.map((reg, idx) => (
                <Card
                  key={idx}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-44 bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] p-6 flex items-center justify-center">
                      <FileText className="h-14 w-14 text-white/90" />
                    </div>
                    <div className="flex-1 p-6 lg:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                            {reg.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            {reg.version && (
                              <Badge
                                variant="secondary"
                                className="bg-[#D66829]/10 text-[#D66829] border-0"
                              >
                                Versión {reg.version}
                              </Badge>
                            )}
                            {reg.effectiveDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(reg.effectiveDate).toLocaleDateString(
                                  "es-PE",
                                  { year: "numeric", month: "long" }
                                )}
                              </span>
                            )}
                            {reg.fileType && (
                              <Badge variant="outline" className="uppercase text-xs">
                                {reg.fileType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {reg.description && (
                        <p className="text-slate-600 mb-4 text-sm md:text-base">
                          {reg.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {reg.fileUrl ? (
                          <>
                            <a
                              href={reg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="outline"
                                className="border-[#0B2A5B] text-[#0B2A5B] hover:bg-[#0B2A5B] hover:text-white"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Button>
                            </a>
                            <a href={reg.fileUrl} download>
                              <Button className="bg-[#D66829] hover:bg-[#c45a22] text-white">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </Button>
                            </a>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            Archivo no disponible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-[6vh] bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <Shield className="h-5 w-5 text-[#D66829] mt-1" />
                <h3 className="text-lg font-bold text-slate-900">
                  Información importante
                </h3>
              </div>
              <p className="text-slate-600 mb-3">
                Los reglamentos publicados son de carácter referencial. Para
                cualquier interpretación oficial o aplicación a casos concretos,
                consulte con la Secretaría del Centro.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/contacto">
                  <Button variant="outline">Contactar Secretaría</Button>
                </Link>
                <Link href="/calculadora">
                  <Button className="bg-[#D66829] hover:bg-[#c45a22] text-white">
                    <Scale className="h-4 w-4 mr-2" />
                    Calculadora de Gastos
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
