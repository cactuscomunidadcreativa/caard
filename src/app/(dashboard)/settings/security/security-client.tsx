"use client";

/**
 * CAARD - Página de Seguridad (Client Component)
 * Cambio de contraseña y configuración de autenticación
 * Con traducciones
 */

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "./change-password-form";
import { useTranslation, useI18n } from "@/lib/i18n";

export function SecurityClient() {
  const { t } = useTranslation();
  const { locale } = useI18n();

  const recommendations = locale === "es"
    ? [
        "Usa una contraseña única que no uses en otros sitios",
        "Incluye letras mayúsculas, minúsculas, números y símbolos",
        "Cambia tu contraseña periódicamente (cada 3-6 meses)",
        "No compartas tu contraseña con nadie",
      ]
    : [
        "Use a unique password that you don't use on other sites",
        "Include uppercase, lowercase letters, numbers and symbols",
        "Change your password periodically (every 3-6 months)",
        "Don't share your password with anyone",
      ];

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.settings.backToSettings}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#D66829]">{t.settings.security}</h1>
            <p className="text-muted-foreground">
              {t.settings.securitySubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cambio de contraseña */}
        <ChangePasswordForm />

        {/* Información de seguridad */}
        <div className="rounded-lg border p-6 bg-muted/30">
          <h3 className="font-semibold mb-2">{t.settings.securityRecommendations}</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
