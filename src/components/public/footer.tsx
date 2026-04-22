"use client";

/**
 * CAARD - Footer Público del Sitio Web
 */

import Link from "next/link";
import {
  Scale,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Linkedin,
  Clock,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "Presentación", href: "/presentacion" },
  { label: "Reglamentos", href: "/reglamentos" },
  { label: "Solicitud Arbitral", href: "/solicitud-arbitral" },
  { label: "Calculadora de Gastos", href: "/calculadora" },
  { label: "Registro de Árbitros", href: "/registro-arbitros" },
  { label: "Eventos", href: "/eventos" },
];

const servicesLinks = [
  { label: "Arbitraje Comercial", href: "/arbitraje" },
  { label: "Arbitraje de Emergencia", href: "/arbitraje-emergencia" },
  { label: "Resolución de Disputas", href: "/resolucion-disputas" },
  { label: "Servicios Ad Hoc", href: "/servicios-ad-hoc" },
  { label: "Peritajes", href: "/peritos" },
];

const legalLinks = [
  { label: "Términos y Condiciones", href: "/terminos" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Código de Ética", href: "/codigo-etica" },
];

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0B2A5B] text-white">
      {/* Sección principal */}
      <div className="container mx-auto px-4 py-[6vh] md:py-[8vh]">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Columna 1: Logo y descripción */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#D66829] shadow-lg">
                <Scale className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xl font-bold">CAARD</span>
                <p className="text-xs text-white/70 leading-tight">
                  Centro de Arbitraje<br />y Resolución de Disputas
                </p>
              </div>
            </Link>
            <p className="text-sm text-white/80 leading-relaxed">
              Institución arbitral que busca impulsar el arbitraje como medio eficaz para la solución de controversias,
              brindando un servicio transparente, eficiente y confidencial.
            </p>

            {/* Redes sociales */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/caard.pe/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-[#D66829] transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/caardpe/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-[#D66829] transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/51923646973"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-green-500 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D66829]">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/80 hover:text-[#D66829] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Servicios */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D66829]">Servicios</h3>
            <ul className="space-y-2">
              {servicesLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/80 hover:text-[#D66829] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#D66829]">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#D66829] shrink-0 mt-0.5" />
                <span className="text-sm text-white/80">
                  Jr. Paramonga 311, Oficina 702<br />
                  Santiago de Surco, Lima
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#D66829] shrink-0" />
                <a href="tel:+51913755003" className="text-sm text-white/80 hover:text-[#D66829] transition-colors">
                  +51 913 755 003
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#D66829] shrink-0" />
                <a href="mailto:administracion@caardpe.com" className="text-sm text-white/80 hover:text-[#D66829] transition-colors">
                  administracion@caardpe.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#D66829] shrink-0" />
                <span className="text-sm text-white/80">
                  Lun - Vie: 9:00 AM - 6:00 PM
                </span>
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-6">
              <Link href="/contacto">
                <Button className="w-full bg-[#D66829] hover:bg-[#c45a22]">
                  <Mail className="h-4 w-4 mr-2" />
                  Contáctenos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Certificaciones ISO */}
      <div className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div>
              <h4 className="text-sm font-semibold text-[#D66829]">
                Certificaciones
              </h4>
              <p className="text-xs text-white/70 mt-1">
                Haz clic en cada logo para descargar el certificado.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <a
                href="/iso/certificado-iso-9001-caard.pdf"
                download="Certificado-ISO-9001-CAARD.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg p-2 hover:scale-105 transition-transform shadow-md"
                aria-label="Descargar Certificado ISO 9001:2015"
                title="Descargar Certificado ISO 9001:2015"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/iso/iso-9001.jpg"
                  alt="Certificación ISO 9001:2015 - QFS Management Systems"
                  className="h-20 md:h-24 w-auto object-contain"
                />
              </a>
              <a
                href="/iso/certificado-iso-37001-caard.pdf"
                download="Certificado-ISO-37001-CAARD.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg p-2 hover:scale-105 transition-transform shadow-md"
                aria-label="Descargar Certificado ISO 37001:2016"
                title="Descargar Certificado ISO 37001:2016"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/iso/iso-37001.jpg"
                  alt="Certificación ISO 37001:2016 - QFS Management Systems"
                  className="h-20 md:h-24 w-auto object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60 text-center md:text-left">
              © {currentYear} CAARD - Centro de Administración de Arbitrajes y Resolución de Disputas S.A.C.
              <br className="md:hidden" />
              <span className="hidden md:inline"> | </span>
              Todos los derechos reservados.
            </p>

            {/* Links legales */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {legalLinks.map((link, index) => (
                <span key={link.href} className="flex items-center gap-4">
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-[#D66829] transition-colors"
                  >
                    {link.label}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="text-white/30 hidden sm:inline">|</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de WhatsApp flotante */}
      <a
        href="https://wa.me/51923646973"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </footer>
  );
}
