/**
 * /admin/configuracion/centro — Datos del Centro (lectura)
 *
 * Muestra información general del centro. La edición se hace en las
 * secciones dedicadas (Drive, notificaciones, etc.).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CentroConfiguracionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const center = session.user.centerId
    ? await prisma.center.findUnique({
        where: { id: session.user.centerId },
      })
    : await prisma.center.findFirst({ where: { code: "CAARD" } });

  if (!center) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontró el centro.
          </CardContent>
        </Card>
      </div>
    );
  }

  const notifSettings = (center.notificationSettings as any) || {};
  const googleConnected = !!notifSettings.googleRefreshToken;

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/configuracion">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#0B2A5B]" />
          Datos del Centro
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
          <CardDescription>
            Datos principales del centro. Para modificar la configuración
            avanzada usa las integraciones dedicadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[160px_1fr] gap-y-3 text-sm">
            <dt className="text-muted-foreground">Código</dt>
            <dd className="font-medium">{center.code}</dd>

            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="font-medium">{center.name}</dd>

            <dt className="text-muted-foreground">Razón social</dt>
            <dd className="font-medium">{center.legalName || "—"}</dd>

            <dt className="text-muted-foreground">RUC</dt>
            <dd className="font-medium">{center.taxId || "—"}</dd>

            <dt className="text-muted-foreground">Color primario</dt>
            <dd className="flex items-center gap-2">
              {center.primaryColorHex ? (
                <>
                  <span
                    className="inline-block w-5 h-5 rounded border"
                    style={{ backgroundColor: center.primaryColorHex }}
                  />
                  <code className="text-xs">{center.primaryColorHex}</code>
                </>
              ) : (
                "—"
              )}
            </dd>

            <dt className="text-muted-foreground">Color de acento</dt>
            <dd className="flex items-center gap-2">
              {center.accentColorHex ? (
                <>
                  <span
                    className="inline-block w-5 h-5 rounded border"
                    style={{ backgroundColor: center.accentColorHex }}
                  />
                  <code className="text-xs">{center.accentColorHex}</code>
                </>
              ) : (
                "—"
              )}
            </dd>

            <dt className="text-muted-foreground">Creado</dt>
            <dd>{new Date(center.createdAt).toLocaleDateString("es-PE")}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-xs text-muted-foreground">
                Almacenamiento de expedientes y documentos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={googleConnected ? "default" : "outline"}>
                {googleConnected ? "Conectado" : "No conectado"}
              </Badge>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/integrations/google">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Gestionar
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="font-medium">Notificaciones</p>
              <p className="text-xs text-muted-foreground">
                Email, WhatsApp, SMS.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/configuracion/notificaciones">
                <ExternalLink className="h-3 w-3 mr-1" />
                Configurar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
