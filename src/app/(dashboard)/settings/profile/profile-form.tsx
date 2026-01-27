/**
 * CAARD - Formulario de Perfil de Usuario
 * Con traducciones
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Building2, Shield, Calendar, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, useI18n } from "@/lib/i18n";

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    phoneE164: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    center: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    phoneE164: user.phoneE164 || "",
  });

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: locale === "es" ? "Super Administrador" : "Super Administrator",
    SECRETARIA: locale === "es" ? "Secretaría Arbitral" : "Arbitration Secretary",
    ARBITRO: locale === "es" ? "Árbitro" : "Arbitrator",
    DEMANDANTE: locale === "es" ? "Demandante" : "Claimant",
    DEMANDADO: locale === "es" ? "Demandado" : "Respondent",
  };

  const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-800 border-red-200",
    SECRETARIA: "bg-purple-100 text-purple-800 border-purple-200",
    ARBITRO: "bg-blue-100 text-blue-800 border-blue-200",
    DEMANDANTE: "bg-green-100 text-green-800 border-green-200",
    DEMANDADO: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || (locale === "es" ? "Error al actualizar perfil" : "Error updating profile"));
      }

      toast({
        title: t.settings.profileUpdated,
        description: t.settings.profileUpdatedDesc,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : (locale === "es" ? "No se pudo actualizar el perfil" : "Could not update profile"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información de la cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#D66829]" />
            {t.settings.accountInfo}
          </CardTitle>
          <CardDescription>
            {t.settings.accountInfoDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border-4 border-[#D66829]">
                <AvatarImage src={user.image || undefined} alt={user.name || (locale === "es" ? "Usuario" : "User")} />
                <AvatarFallback className="text-2xl bg-[#D66829] text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Camera className="h-4 w-4" />
                {t.settings.changePhoto}
              </Button>
            </div>

            {/* Información readonly */}
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t.settings.emailLabel}
                  </Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t.settings.roleLabel}
                  </Label>
                  <div className="h-10 flex items-center">
                    <Badge className={ROLE_COLORS[user.role] || "bg-gray-100"}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t.settings.arbitrationCenter}
                  </Label>
                  <Input
                    value={user.center?.name || (locale === "es" ? "No asignado" : "Not assigned")}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t.settings.memberSince}
                  </Label>
                  <Input
                    value={new Date(user.createdAt).toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario editable */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.personalInfo}</CardTitle>
          <CardDescription>
            {t.settings.personalInfoDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t.settings.fullName}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={locale === "es" ? "Tu nombre completo" : "Your full name"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.settings.phoneLabel}</Label>
                <Input
                  id="phone"
                  value={formData.phoneE164}
                  onChange={(e) => setFormData({ ...formData, phoneE164: e.target.value })}
                  placeholder="+51 999 999 999"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-[#D66829] hover:bg-[#c45a22]">
                {isLoading ? t.common.loading : t.settings.saveChanges}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Estado de la cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.accountStatus}</CardTitle>
          <CardDescription>
            {t.settings.accountStatusDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t.settings.currentStatus}</p>
              <p className="text-sm text-muted-foreground">
                {user.isActive
                  ? (locale === "es" ? "Tu cuenta está activa y funcionando correctamente" : "Your account is active and working correctly")
                  : (locale === "es" ? "Tu cuenta está desactivada" : "Your account is deactivated")}
              </p>
            </div>
            <Badge variant={user.isActive ? "default" : "destructive"}>
              {user.isActive ? t.settings.active : t.settings.inactive}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
