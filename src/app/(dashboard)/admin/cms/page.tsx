"use client";

/**
 * CAARD CMS - Panel Principal de Administración
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Newspaper,
  Calendar,
  Bell,
  Settings,
  Plus,
  Eye,
  Loader2,
  LayoutDashboard,
  Menu,
  Image as ImageIcon,
  Scale,
  HelpCircle,
  Briefcase,
  MapPin,
  BookOpen,
  Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Stats {
  pages: number;
  articles: number;
  events: number;
  announcements: number;
}

const CMS_SECTIONS = [
  {
    title: "Páginas",
    description: "Gestiona las páginas del sitio web",
    icon: FileText,
    href: "/admin/cms/pages",
    color: "bg-blue-500",
  },
  {
    title: "Menú",
    description: "Edita la navegación del sitio",
    icon: Menu,
    href: "/admin/cms/menu",
    color: "bg-indigo-500",
    noNew: true,
  },
  {
    title: "Artículos",
    description: "Blog y noticias del centro",
    icon: Newspaper,
    href: "/admin/cms/articles",
    color: "bg-green-500",
  },
  {
    title: "Eventos",
    description: "Webinars, conferencias y talleres",
    icon: Calendar,
    href: "/admin/cms/events",
    color: "bg-purple-500",
  },
  {
    title: "Avisos",
    description: "Anuncios y notificaciones",
    icon: Bell,
    href: "/admin/cms/announcements",
    color: "bg-amber-500",
  },
  {
    title: "Medios",
    description: "Biblioteca de imágenes y archivos",
    icon: ImageIcon,
    href: "/admin/cms/media",
    color: "bg-rose-500",
    noNew: true,
  },
  {
    title: "Configuración",
    description: "Ajustes del sitio web",
    icon: Settings,
    href: "/admin/cms/config",
    color: "bg-gray-500",
    noNew: true,
  },
];

// Secciones de contenido especializado
const CONTENT_SECTIONS = [
  {
    title: "Nómina de Árbitros",
    description: "Registro público de árbitros del centro",
    icon: Scale,
    href: "/admin/cms/arbitrators",
    color: "bg-[#D66829]",
  },
  {
    title: "Equipo",
    description: "Miembros del consejo y personal",
    icon: Users,
    href: "/admin/cms/team",
    color: "bg-cyan-500",
  },
  {
    title: "Reglamentos",
    description: "Reglamentos y documentos normativos",
    icon: BookOpen,
    href: "/admin/cms/regulations",
    color: "bg-emerald-500",
  },
  {
    title: "Servicios",
    description: "Servicios ofrecidos por el centro",
    icon: Briefcase,
    href: "/admin/cms/services",
    color: "bg-violet-500",
  },
  {
    title: "Sedes",
    description: "Ubicaciones y oficinas del centro",
    icon: MapPin,
    href: "/admin/cms/locations",
    color: "bg-pink-500",
  },
  {
    title: "Preguntas Frecuentes",
    description: "FAQ y ayuda para usuarios",
    icon: HelpCircle,
    href: "/admin/cms/faqs",
    color: "bg-teal-500",
  },
];

export default function CmsAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [pagesRes, articlesRes, eventsRes, announcementsRes] = await Promise.all([
          fetch("/api/cms/pages"),
          fetch("/api/cms/articles"),
          fetch("/api/cms/events"),
          fetch("/api/cms/announcements"),
        ]);

        const pages = await pagesRes.json();
        const articles = await articlesRes.json();
        const events = await eventsRes.json();
        const announcements = await announcementsRes.json();

        setStats({
          pages: Array.isArray(pages) ? pages.length : 0,
          articles: articles.total || 0,
          events: events.total || 0,
          announcements: Array.isArray(announcements) ? announcements.length : 0,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Administrador de Contenido
          </h1>
          <p className="text-muted-foreground">
            Gestiona el contenido del sitio web de CAARD
          </p>
        </div>
        <Button asChild>
          <Link href="/" target="_blank">
            <Eye className="h-4 w-4 mr-2" />
            Ver Sitio
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Páginas</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.pages || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Artículos</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.articles || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Newspaper className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.events || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avisos</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.announcements || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CMS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={section.href}>
                      Gestionar
                    </Link>
                  </Button>
                  {!section.noNew && (
                    <Button asChild size="icon" variant="default">
                      <Link href={`${section.href}/new`}>
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Sections */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Contenido Especializado</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CONTENT_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.href} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={section.href}>
                      Gestionar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/cms/pages/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Página
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cms/articles/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Artículo
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cms/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cms/announcements/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Aviso
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cms/arbitrators">
                <Scale className="h-4 w-4 mr-2" />
                Gestionar Árbitros
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
