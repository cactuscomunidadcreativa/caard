/**
 * CAARD - Detalle de Orden de Pago
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, DollarSign, Calendar, CheckCircle, Clock } from "lucide-react";

function serializeForClient(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeForClient);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeForClient(value);
    }
    return result;
  }
  return obj;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  PAID: { label: "Pagado", color: "bg-green-100 text-green-800" },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
  PARTIAL: { label: "Parcial", color: "bg-blue-100 text-blue-800" },
  REFUNDED: { label: "Reembolsado", color: "bg-purple-100 text-purple-800" },
};

const conceptLabels: Record<string, string> = {
  GASTOS_ADMINISTRATIVOS: "Gastos Administrativos",
  TASA_PRESENTACION: "Tasa de Presentación",
  HONORARIOS_TRIBUNAL: "Honorarios del Tribunal",
  HONORARIOS_ARBITRO_UNICO: "Honorarios Árbitro Único",
  TASA_EMERGENCIA: "Tasa de Emergencia",
  OTROS: "Otros",
};

export default async function PaymentOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const order = await prisma.paymentOrder.findUnique({
    where: { id },
    include: {
      case: { select: { id: true, code: true, title: true, claimantName: true, respondentName: true } },
    },
  });

  if (!order) notFound();

  const fmt = (cents: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: order.currency }).format(cents / 100);
  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  const st = statusLabels[order.status] || { label: order.status, color: "bg-gray-100" };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/pagos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Orden de Pago</h1>
          <p className="text-sm text-muted-foreground font-mono">{order.orderNumber}</p>
        </div>
        <Badge className={`ml-auto ${st.color}`}>{st.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#D66829]" />
            {conceptLabels[order.concept] || order.concept}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Expediente</p>
              <Link href={`/cases/${order.case.id}`} className="text-[#0B2A5B] font-medium hover:underline">
                {order.case.code}
              </Link>
              <p className="text-xs text-muted-foreground">{order.case.title?.slice(0, 60)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Descripción</p>
              <p className="font-medium">{order.description || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Monto Base</p>
              <p className="text-lg font-bold">{fmt(order.amountCents)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">IGV</p>
              <p className="text-lg">{order.igvCents > 0 ? fmt(order.igvCents) : "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-[#0B2A5B]">{fmt(order.totalCents)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Moneda</p>
              <p>{order.currency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha emisión</p>
              <p>{fmtDate(order.issuedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vencimiento</p>
              <p>{fmtDate(order.dueAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha de pago</p>
              <p>{order.paidAt ? fmtDate(order.paidAt) : "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
