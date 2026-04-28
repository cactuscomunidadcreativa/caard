/**
 * CAARD CMS - Footer Moderno del Sitio Web Público
 * Color primario: Naranja (#D66829)
 * Color acento: Azul (#0B2A5B)
 * Diseño: Moderno, gradientes, responsive
 */

"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import {
  Scale,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ExternalLink,
  Clock,
  Shield,
  FileText,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteConfig {
  siteName?: string | null;
  siteTagline?: string | null;
  logoUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  footerText?: string | null;
  copyrightText?: string | null;
}

interface WebsiteFooterProps {
  config: SiteConfig;
}

export function WebsiteFooter({ config }: WebsiteFooterProps) {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <>
      {/* CTA Section - Antes del footer */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#0B2A5B] py-16 lg:py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D66829]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D66829]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D66829]/20 text-[#D66829] text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              {t.website.leaderCenter}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {t.website.readyToResolve}
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t.website.startProcess}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/solicitud-arbitral">
                  {t.website.startArbitrationRequest}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg rounded-xl backdrop-blur-sm"
              >
                <Link href="/contacto">
                  {t.website.contactUs}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-[#0B2A5B] text-white">
        {/* Features Bar */}
        <div className="border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20">
                  <Shield className="h-5 w-5 text-[#D66829]" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t.website.confidentiality}</p>
                  <p className="text-xs text-white/60">{t.website.guaranteed}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20">
                  <Clock className="h-5 w-5 text-[#D66829]" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t.website.resolution}</p>
                  <p className="text-xs text-white/60">{t.website.efficient}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20">
                  <Users className="h-5 w-5 text-[#D66829]" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t.website.arbitrators}</p>
                  <p className="text-xs text-white/60">{t.website.specialized}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20">
                  <FileText className="h-5 w-5 text-[#D66829]" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t.website.award}</p>
                  <p className="text-xs text-white/60">{t.website.executable}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Logo y descripción */}
            <div className="lg:col-span-4">
              <Link href="/" className="flex items-center gap-3 group mb-6">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt={config.siteName || "CAARD"} className="h-12" />
                ) : (
                  <>
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white shadow-lg">
                        <Scale className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-2xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        {config.siteName || "CAARD"}
                      </span>
                      <span className="text-xs text-white/60 tracking-wide">
                        {t.website.arbitrationCenter}
                      </span>
                    </div>
                  </>
                )}
              </Link>

              {config.siteTagline && (
                <p className="text-white/80 text-sm mb-4">{config.siteTagline}</p>
              )}

              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {config.footerText || t.website.footerDescription}
              </p>

              {/* Redes sociales */}
              <div className="flex gap-3">
                {config.instagramUrl && (
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-[#D66829] transition-all duration-300 group"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </a>
                )}
                {config.linkedinUrl && (
                  <a
                    href={config.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-[#D66829] transition-all duration-300 group"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </a>
                )}
                {config.youtubeUrl && (
                  <a
                    href={config.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-[#D66829] transition-all duration-300 group"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            {/* Links - El Centro */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#D66829] rounded-full" />
                {t.website.theCenter}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/presentacion" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.presentation}
                  </Link>
                </li>
                <li>
                  <Link href="/secretaria-general" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.generalSecretary}
                  </Link>
                </li>
                <li>
                  <Link href="/consejo-superior" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.superiorCouncil}
                  </Link>
                </li>
                <li>
                  <Link href="/sedes" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.locations}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links - Servicios */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#D66829] rounded-full" />
                {t.website.services}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/arbitraje" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.arbitration}
                  </Link>
                </li>
                <li>
                  <Link href="/reglamentos" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.regulations}
                  </Link>
                </li>
                <li>
                  <Link href="/calculadora" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.expenseCalculator}
                  </Link>
                </li>
                <li>
                  <Link href="/solicitud-arbitral" className="text-white/70 hover:text-[#D66829] transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t.website.arbitrationRequest}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div className="lg:col-span-4">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#D66829] rounded-full" />
                {t.website.contact}
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href={`tel:${config.contactPhone || "+51913755003"}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20 group-hover:bg-[#D66829] transition-colors">
                      <Phone className="h-4 w-4 text-[#D66829] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">{t.website.phone}</p>
                      <p className="font-medium">{config.contactPhone || "(51) 913 755 003"}</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${config.contactEmail || "mesadepartes@caardpe.com"}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20 group-hover:bg-[#D66829] transition-colors">
                      <Mail className="h-4 w-4 text-[#D66829] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">{t.website.email}</p>
                      <p className="font-medium text-sm">{config.contactEmail || "mesadepartes@caardpe.com"}</p>
                    </div>
                  </a>
                </li>
                <li>
                  <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20 shrink-0">
                      <MapPin className="h-4 w-4 text-[#D66829]" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">{t.website.address}</p>
                      <p className="font-medium text-sm">
                        {config.contactAddress || "Lima, Perú"}
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
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
                {/* Licencia Municipal de Funcionamiento */}
                <a
                  href="/iso/licencia-municipal-funcionamiento-caard.pdf"
                  download="Licencia-Municipal-Funcionamiento-CAARD.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-white rounded-lg p-3 hover:scale-105 transition-transform shadow-md text-center min-w-[160px] h-20 md:h-24 border-2 border-[#D66829]"
                  aria-label="Descargar Licencia Municipal de Funcionamiento"
                  title="Descargar Licencia Municipal de Funcionamiento"
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#D66829] font-bold leading-tight">
                    Licencia Municipal
                  </div>
                  <div className="text-xs font-semibold text-[#0B2A5B] leading-tight mt-0.5">
                    de Funcionamiento
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5">
                    Santiago de Surco
                  </div>
                </a>
                {/* Libro de Reclamaciones — al lado de Licencia Municipal */}
                <Link
                  href="/libro-de-reclamaciones"
                  className="flex flex-col items-center justify-center bg-white rounded-lg p-3 hover:scale-105 transition-transform shadow-md text-center min-w-[160px] h-20 md:h-24 border-2 border-[#D66829]"
                  aria-label="Libro de Reclamaciones"
                  title="Libro de Reclamaciones"
                >
                  <div className="text-2xl leading-none">📕</div>
                  <div className="text-xs font-semibold text-[#0B2A5B] leading-tight mt-1">
                    Libro de Reclamaciones
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5">
                    INDECOPI
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <p className="text-white/50 text-sm text-center md:text-left">
                © {currentYear} CAARD. {t.website.copyright}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
                <Link href="/politica-privacidad" className="hover:text-[#D66829] transition-colors">
                  {t.website.privacyPolicy}
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link href="/terminos-condiciones" className="hover:text-[#D66829] transition-colors">
                  {t.website.termsConditions}
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link href="/login" className="hover:text-[#D66829] transition-colors flex items-center gap-1">
                  {t.website.clientAccess}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
