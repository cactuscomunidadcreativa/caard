"use client";

/**
 * CAARD - Página de Configuración (Client Component)
 * Con traducciones
 */

import Link from "next/link";
import { User, Lock, Bell, Shield, Building2, Palette, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation, useI18n } from "@/lib/i18n";

interface SettingsClientProps {
  userRole: string;
  isAdmin: boolean;
}

export function SettingsClient({ userRole, isAdmin }: SettingsClientProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();

  const settingsOptions = [
    {
      title: t.settings.myProfile,
      description: t.settings.profileDescription,
      href: "/settings/profile",
      icon: User,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: t.settings.security,
      description: t.settings.securityDescription,
      href: "/settings/security",
      icon: Lock,
      color: "text-green-600 bg-green-100",
    },
    {
      title: t.settings.notifications,
      description: t.settings.notificationsDescription,
      href: "/settings/notifications",
      icon: Bell,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  const adminOptions = [
    {
      title: t.settings.userManagement,
      description: t.settings.userManagementDesc,
      href: "/admin/users",
      icon: Users,
      color: "text-red-600 bg-red-100",
      roles: ["SUPER_ADMIN"],
    },
    {
      title: t.settings.rolesPermissions,
      description: t.settings.rolesPermissionsDesc,
      href: "/admin/roles",
      icon: Shield,
      color: "text-indigo-600 bg-indigo-100",
      roles: ["SUPER_ADMIN"],
    },
    {
      title: t.settings.arbitrationCenters,
      description: t.settings.arbitrationCentersDesc,
      href: "/admin/centers",
      icon: Building2,
      color: "text-orange-600 bg-orange-100",
      roles: ["SUPER_ADMIN"],
    },
    {
      title: t.settings.siteConfiguration,
      description: t.settings.siteConfigurationDesc,
      href: "/admin/cms",
      icon: Palette,
      color: "text-pink-600 bg-pink-100",
      roles: ["SUPER_ADMIN"],
    },
  ];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#D66829]">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Opciones generales */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{locale === "es" ? "General" : "General"}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsOptions.map((option) => (
            <Link key={option.href} href={option.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center mb-2`}>
                    <option.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{option.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Opciones de administración */}
      {isAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t.settings.administration}</h2>
            <Badge variant="outline" className="text-[#D66829] border-[#D66829]">
              Admin
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adminOptions
              .filter((option) => option.roles.includes(userRole))
              .map((option) => (
                <Link key={option.href} href={option.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-l-4 border-l-[#D66829]">
                    <CardHeader className="pb-2">
                      <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center mb-2`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{option.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
