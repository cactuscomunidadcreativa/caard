/**
 * /admin/configuracion — Hub de configuración del centro
 *
 * Lista las áreas de configuración disponibles. Cada tarjeta enlaza a la
 * página específica (notificaciones, centro, etc.).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Settings,
  Bell,
  Building2,
  Calculator,
  FileText,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SECCIONES = [
  {
    href: "/admin/configuracion/centro",
    title: "Datos del Centro",
    description: "Nombre, razón social, RUC, colores de marca, Google Drive.",
    icon: Building2,
    color: "text-[#0B2A5B]",
  },
  {
    href: "/admin/configuracion/notificaciones",
    title: "Notificaciones",
    description: "Configurar canales de email, WhatsApp y SMS.",
    icon: Bell,
    color: "text-[#D66829]",
  },
  {
    href: "/admin/configuracion/impuestos",
    title: "Impuestos",
    description: "IGV y parámetros fiscales.",
    icon: Calculator,
    color: "text-green-600",
  },
  {
    href: "/admin/configuracion/tributacion",
    title: "Tributación",
    description: "Facturación electrónica y serie de comprobantes.",
    icon: FileText,
    color: "text-blue-600",
  },
];

export const dynamic = "force-dynamic";

export default async function ConfiguracionHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#D66829]" />
          Configuración del Centro
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra los ajustes generales y de integraciones del centro.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SECCIONES.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.href} className="hover:shadow-md transition-shadow">
              <Link href={s.href} className="block">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${s.color}`} />
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription className="mt-2">
                    {s.description}
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
