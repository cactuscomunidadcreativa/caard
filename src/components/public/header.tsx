"use client";

/**
 * CAARD - Header Público del Sitio Web
 * Navegación principal con menú responsive
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Search,
  Phone,
  Mail,
  Scale,
  Building2,
  Users,
  FileText,
  Calendar,
  Newspaper,
  MessageSquare,
  LogIn,
  Instagram,
  Linkedin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/cms/language-selector";

// Estructura del menú
const menuItems = [
  {
    label: "El Centro",
    href: "/centro",
    children: [
      { label: "Presentación", href: "/presentacion", icon: Building2 },
      { label: "Secretaría General", href: "/secretaria-general", icon: Users },
      { label: "Consejo Superior de Arbitraje", href: "/consejo-superior", icon: Scale },
      { label: "Nómina de Árbitros", href: "/registro-arbitros", icon: Users },
      { label: "Guías", href: "/guias", icon: FileText },
      { label: "Sedes", href: "/sedes", icon: Building2 },
    ],
  },
  {
    label: "Arbitraje",
    href: "/arbitraje",
    children: [
      { label: "Reglamentos", href: "/reglamentos", icon: FileText },
      { label: "Solicitud Arbitral", href: "/solicitud-arbitral", icon: FileText },
      { label: "Calculadora de Gastos", href: "/calculadora", icon: Scale },
      { label: "Arbitraje de Emergencia", href: "/arbitraje-emergencia", icon: Scale },
      { label: "Servicios Ad Hoc", href: "/servicios-ad-hoc", icon: Building2 },
      { label: "Cláusula Arbitral", href: "/clausula-arbitral", icon: FileText },
    ],
  },
  {
    label: "Resolución de Disputas",
    href: "/resolucion-disputas",
    children: [],
  },
  {
    label: "Consulta de Expedientes",
    href: "/login",
    children: [],
  },
  {
    label: "Peritos",
    href: "/peritos",
    children: [],
  },
  {
    label: "Eventos",
    href: "/eventos",
    children: [],
  },
  {
    label: "Artículos",
    href: "/articulos",
    children: [],
  },
  {
    label: "Contacto",
    href: "/contacto",
    children: [],
  },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Barra superior */}
      <div className="bg-[#0B2A5B] text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="hidden md:flex items-center gap-6">
              <a href="tel:+51977236143" className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                <Phone className="h-3 w-3" />
                +51 977 236 143
              </a>
              <a href="mailto:administracion@caardpe.com" className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                <Mail className="h-3 w-3" />
                administracion@caardpe.com
              </a>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <LanguageSelector />
              <a
                href="https://www.instagram.com/caard.pe/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D66829] transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/caardpe/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D66829] transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <Link href="/login" className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                <LogIn className="h-4 w-4" />
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white shadow-lg">
              <Scale className="h-7 w-7" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-[#0B2A5B]">CAARD</span>
              <p className="text-xs text-slate-500 leading-tight">
                Centro de Arbitraje<br />y Resolución de Disputas
              </p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {menuItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  {item.children.length > 0 ? (
                    <>
                      <NavigationMenuTrigger className="text-sm font-medium text-slate-700 hover:text-[#D66829]">
                        {item.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-1 p-4">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-50 hover:text-[#D66829]",
                                    pathname === child.href && "bg-slate-50 text-[#D66829]"
                                  )}
                                >
                                  <child.icon className="h-5 w-5 text-[#D66829]" />
                                  <span className="text-sm font-medium">{child.label}</span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "text-sm font-medium text-slate-700 hover:text-[#D66829]",
                          pathname === item.href && "text-[#D66829]"
                        )}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            {/* Búsqueda */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden md:flex"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Menú móvil */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[#D66829]" />
                    CAARD
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {menuItems.map((item) => (
                    <div key={item.href}>
                      {item.children.length > 0 ? (
                        <Collapsible>
                          <CollapsibleTrigger className="flex w-full items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 text-left">
                            <span className="font-medium">{item.label}</span>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-4">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-slate-50",
                                  pathname === child.href && "text-[#D66829] bg-slate-50"
                                )}
                              >
                                <child.icon className="h-4 w-4 text-[#D66829]" />
                                {child.label}
                              </Link>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center py-3 px-4 rounded-lg hover:bg-slate-50",
                            pathname === item.href && "text-[#D66829] bg-slate-50"
                          )}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-[#D66829] hover:bg-[#c45a22]">
                        <LogIn className="h-4 w-4 mr-2" />
                        Ingresar al Sistema
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Barra de búsqueda expandible */}
        {searchOpen && (
          <div className="pb-4">
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar en el sitio..."
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
