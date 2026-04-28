/**
 * /terminos-condiciones — Términos y Condiciones de los servicios CAARD.
 * Renderiza el PDF oficial + botón de descarga.
 */
import { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowLeft, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Términos y Condiciones — CAARD",
  description:
    "Términos y Condiciones de los servicios del Centro de Arbitraje y Resolución de Disputas (CAARD). Versión vigente desde abril de 2026.",
};

const PDF_PATH = "/legal/terminos-y-condiciones-caard.pdf";

export default function TerminosCondicionesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[8vh] overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-4">
              <Scale className="h-4 w-4" />
              Marco legal
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Términos y Condiciones de los Servicios
            </h1>
            <p className="text-base md:text-lg text-white/90 leading-relaxed">
              Centro de Arbitraje y Resolución de Disputas — CAARD
            </p>
            <p className="text-sm text-white/70 mt-2">
              Versión vigente desde abril de 2026
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={PDF_PATH}
                download="Terminos-y-Condiciones-CAARD.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-white text-[#D66829] hover:bg-white/90 font-semibold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </a>
              <a href={PDF_PATH} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Visor del PDF */}
      <section className="py-[5vh] bg-slate-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
            <div className="bg-slate-100 border-b px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#D66829]" />
                Terminos-y-Condiciones-CAARD.pdf
              </p>
              <a
                href={PDF_PATH}
                download="Terminos-y-Condiciones-CAARD.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#D66829] hover:underline inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Descargar
              </a>
            </div>
            <iframe
              src={`${PDF_PATH}#view=FitH&toolbar=1`}
              className="w-full"
              style={{ height: "calc(100vh - 220px)", minHeight: 720 }}
              title="Términos y Condiciones CAARD"
            />
          </div>

          {/* Resumen rápido (texto seleccionable y copiable) */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6 prose prose-slate max-w-none">
            <h2 className="text-xl font-bold text-[#0B2A5B] mt-0">
              Resumen del documento
            </h2>
            <p className="text-sm text-muted-foreground">
              Si tu navegador no muestra el PDF, descárgalo con el botón de
              arriba. El documento contiene:
            </p>
            <ol className="text-sm text-slate-700 space-y-1 mt-2 columns-1 md:columns-2 gap-x-8">
              <li>Identificación del titular</li>
              <li>Objeto</li>
              <li>Aceptación de los Términos</li>
              <li>Servicios ofrecidos</li>
              <li>Requisitos para acceder</li>
              <li>Tarifas y forma de pago</li>
              <li>Solicitud y trámite del servicio</li>
              <li>Independencia, imparcialidad y deber de revelación</li>
              <li>Confidencialidad</li>
              <li>Tratamiento de datos personales</li>
              <li>Propiedad intelectual</li>
              <li>Uso del sitio web y plataformas digitales</li>
              <li>Comunicaciones y notificaciones</li>
              <li>Suspensión, archivamiento y cancelación del servicio</li>
              <li>Limitación de responsabilidad</li>
              <li>Régimen ético y disciplinario</li>
              <li>Modificación de los Términos</li>
              <li>Nulidad parcial</li>
              <li>Ley aplicable y solución de controversias</li>
              <li>Vigencia</li>
              <li>Contacto</li>
            </ol>

            <h3 className="text-lg font-semibold text-[#0B2A5B] mt-6">
              Contacto
            </h3>
            <p className="text-sm">
              Para consultas vinculadas a estos Términos:
            </p>
            <ul className="text-sm">
              <li>
                Correo institucional:{" "}
                <a
                  href="mailto:administracion@caardpe.com"
                  className="text-[#D66829] hover:underline"
                >
                  administracion@caardpe.com
                </a>
              </li>
              <li>
                Mesa de partes virtual:{" "}
                <a
                  href="mailto:mesadepartes@caardpe.com"
                  className="text-[#D66829] hover:underline"
                >
                  mesadepartes@caardpe.com
                </a>
              </li>
              <li>
                Domicilio: Jr. Aldebarán No. 596, Oficina 1409, Edificio IQ
                Surco, Santiago de Surco, Lima — Perú
              </li>
              <li>Teléfono: (+51) 913 755 003</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
