/**
 * CAARD CMS - Header del Sitio Web Público
 * Estilo: Azul institucional (#0B2A5B) con acentos naranja (#D66829)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, Phone, Mail, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LanguageSelector } from "./language-selector";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface MenuItem {
  id: string;
  label: string;
  url: string | null;
  pageSlug: string | null;
  children?: MenuItem[];
}

interface SiteConfig {
  siteName?: string | null;
  siteTagline?: string | null;
  logoUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

interface WebsiteHeaderProps {
  menuItems: MenuItem[];
  siteName?: string;
  logoUrl?: string;
  config?: SiteConfig;
}

export function WebsiteHeader({
  menuItems,
  siteName = "CAARD",
  logoUrl,
  config
}: WebsiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  // Sistema de mapeo para traducir labels del menú dinámico
  const menuTranslations: Record<string, string> = {
    // Menú principal
    "El Centro": t.website.theCenter,
    "The Center": t.website.theCenter,
    "Servicios": t.website.services,
    "Services": t.website.services,
    "Normativa": t.website.normative,
    "Normative": t.website.normative,
    "Eventos": t.website.events,
    "Events": t.website.events,
    "Artículos": t.website.articles,
    "Articles": t.website.articles,
    "Noticias": t.website.news,
    "News": t.website.news,
    "Contacto": t.website.contact,
    "Contact": t.website.contact,
    // Submenús - El Centro
    "Presentación": t.website.presentation,
    "Presentation": t.website.presentation,
    "Secretaría General": t.website.generalSecretary,
    "General Secretary": t.website.generalSecretary,
    "Consejo Superior": t.website.superiorCouncil,
    "Superior Council": t.website.superiorCouncil,
    "Sedes": t.website.locations,
    "Locations": t.website.locations,
    // Submenús - Servicios
    "Arbitraje": t.website.arbitration,
    "Arbitration": t.website.arbitration,
    "Arbitraje de Emergencia": t.website.emergencyArbitration,
    "Emergency Arbitration": t.website.emergencyArbitration,
    "Calculadora de Gastos": t.website.expenseCalculator,
    "Expense Calculator": t.website.expenseCalculator,
    "Solicitud Arbitral": t.website.arbitrationRequest,
    "Arbitration Request": t.website.arbitrationRequest,
    "Árbitros": t.website.arbitrators,
    "Arbitrators": t.website.arbitrators,
    "Tarifas": t.website.fees,
    "Fees": t.website.fees,
    // Otros
    "Nosotros": t.website.aboutUs,
    "About Us": t.website.aboutUs,
    "Reglamentos": t.website.regulations,
    "Regulations": t.website.regulations,
    "Registro de Árbitros": t.website.arbitratorRegistry,
    "Arbitrator Registry": t.website.arbitratorRegistry,
  };

  // Función para obtener el label traducido
  const getTranslatedLabel = (label: string): string => {
    return menuTranslations[label] || label;
  };

  // Usar config si está disponible
  const displayName = config?.siteName || siteName;
  const displayLogo = config?.logoUrl || logoUrl;
  const phone = config?.contactPhone || "(51) 977 236 143";
  const email = config?.contactEmail || "mesadepartes@caardpe.com";

  // Detectar scroll para cambiar el estilo del header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getHref = (item: MenuItem) => {
    if (item.url) return item.url;
    if (item.pageSlug) return `/${item.pageSlug}`;
    return "#";
  };

  return (
    <>
      {/* Top Bar - Solo desktop */}
      <div className="hidden lg:block bg-[#0B2A5B] text-white text-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-6">
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                <Phone className="h-3.5 w-3.5" />
                <span>{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                <Mail className="h-3.5 w-3.5" />
                <span>{email}</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link
                href="/login"
                className="text-white/80 hover:text-white transition-colors"
              >
                {t.website.clientAccess}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - Estilo Azul */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 bg-[#0B2A5B]",
          scrolled && "shadow-lg"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {displayLogo ? (
                <Image
                  src={displayLogo}
                  alt={displayName}
                  width={180}
                  height={48}
                  className="h-10 lg:h-12 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl lg:text-2xl text-[#D66829]">
                    {displayName}
                  </span>
                  <span className="hidden sm:block text-xs text-white/60 border-l border-white/20 pl-3">
                    {t.website.arbitrationCenter}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavigationMenu>
                <NavigationMenuList className="gap-1">
                  {menuItems.map((item) => (
                    <NavigationMenuItem key={item.id}>
                      {item.children && item.children.length > 0 ? (
                        <>
                          <NavigationMenuTrigger className="h-10 bg-transparent text-white/90 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10 data-[state=open]:text-white rounded-lg font-medium">
                            {getTranslatedLabel(item.label)}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="w-[220px] p-2 bg-white rounded-lg shadow-xl">
                              {item.children.map((child) => (
                                <li key={child.id}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={getHref(child)}
                                      className="block select-none rounded-md px-4 py-2.5 text-sm font-medium text-slate-700 no-underline outline-none transition-colors hover:bg-[#0B2A5B] hover:text-white"
                                    >
                                      {getTranslatedLabel(child.label)}
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <Link
                          href={getHref(item)}
                          className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {getTranslatedLabel(item.label)}
                        </Link>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              <Button
                asChild
                className="ml-4 h-10 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white shadow-lg hover:shadow-xl transition-all rounded-lg px-6"
              >
                <Link href="/solicitud-arbitral">
                  {t.website.startArbitration}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </nav>

            {/* Mobile: Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <LanguageSelector />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div
            className={cn(
              "lg:hidden overflow-hidden transition-all duration-300",
              mobileMenuOpen ? "max-h-[80vh] opacity-100 pb-6" : "max-h-0 opacity-0"
            )}
          >
            <nav className="border-t border-white/10 pt-4">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    {item.children && item.children.length > 0 ? (
                      <details className="group">
                        <summary className="flex items-center justify-between p-3 cursor-pointer font-medium text-white rounded-lg hover:bg-white/10">
                          {getTranslatedLabel(item.label)}
                          <ChevronDown className="h-4 w-4 text-[#D66829] transition-transform group-open:rotate-180" />
                        </summary>
                        <ul className="pl-4 space-y-1 mt-1 ml-3 border-l-2 border-[#D66829]/30">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={getHref(child)}
                                className="flex items-center gap-2 p-2.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <ArrowRight className="h-3 w-3 text-[#D66829]" />
                                {getTranslatedLabel(child.label)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <Link
                        href={getHref(item)}
                        className="block p-3 font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {getTranslatedLabel(item.label)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {/* Mobile CTA */}
              <div className="mt-6 space-y-3">
                <Button
                  asChild
                  className="w-full h-12 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white rounded-xl"
                >
                  <Link href="/solicitud-arbitral" onClick={() => setMobileMenuOpen(false)}>
                    {t.website.startArbitration}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-12 border-white/30 text-white hover:bg-white/10 rounded-xl"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    {t.website.clientAccess}
                  </Link>
                </Button>
              </div>

              {/* Mobile Contact */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 text-white/80 hover:text-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20">
                    <Phone className="h-4 w-4 text-[#D66829]" />
                  </div>
                  <span>{phone}</span>
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 text-white/80 hover:text-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D66829]/20">
                    <Mail className="h-4 w-4 text-[#D66829]" />
                  </div>
                  <span className="text-sm">{email}</span>
                </a>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
