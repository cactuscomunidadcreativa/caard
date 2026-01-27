/**
 * CAARD - Página pública de pago
 * Permite a usuarios pagar una orden de pago específica
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PaymentPageClient } from "./client";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;

  // Buscar la orden de pago
  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { id },
    include: {
      case: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });

  if (!paymentOrder) {
    notFound();
  }

  // Verificar que la orden no esté pagada
  if (paymentOrder.status === "PAID") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pago Completado</h1>
          <p className="text-slate-600 mb-4">
            Esta orden de pago ya fue procesada exitosamente.
          </p>
          {paymentOrder.paidAt && (
            <p className="text-sm text-slate-500">
              Pagado el {new Date(paymentOrder.paidAt).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Verificar que la orden no esté cancelada
  if (paymentOrder.status === "CANCELLED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Orden Cancelada</h1>
          <p className="text-slate-600">
            Esta orden de pago ha sido cancelada y ya no es válida.
          </p>
        </div>
      </div>
    );
  }

  // Verificar fecha de vencimiento si existe
  if (paymentOrder.dueAt && new Date(paymentOrder.dueAt) < new Date()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Orden Vencida</h1>
          <p className="text-slate-600 mb-4">
            Esta orden de pago ha vencido. Por favor contacte a CAARD para generar una nueva orden.
          </p>
          <p className="text-sm text-slate-500">
            Fecha de vencimiento: {new Date(paymentOrder.dueAt).toLocaleDateString("es-PE")}
          </p>
        </div>
      </div>
    );
  }

  // Formatear datos para el cliente
  const paymentData = {
    id: paymentOrder.id,
    amount: paymentOrder.totalCents,
    currency: paymentOrder.currency as "PEN" | "USD",
    concept: paymentOrder.concept || "PAGO",
    description: paymentOrder.description || undefined,
    caseId: paymentOrder.caseId,
    caseCode: paymentOrder.case?.code || undefined,
    caseSubject: paymentOrder.case?.title || undefined,
    customerEmail: undefined,
    customerName: undefined,
    dueAt: paymentOrder.dueAt?.toISOString() || undefined,
  };

  return <PaymentPageClient paymentData={paymentData} />;
}

// Metadata
export async function generateMetadata({ params }: PaymentPageProps) {
  const { id } = await params;

  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { id },
    select: {
      concept: true,
      totalCents: true,
      currency: true,
    },
  });

  if (!paymentOrder) {
    return {
      title: "Pago no encontrado - CAARD",
    };
  }

  const amount = (paymentOrder.totalCents / 100).toFixed(2);
  const currency = paymentOrder.currency === "USD" ? "$" : "S/";

  return {
    title: `Pago ${currency}${amount} - CAARD`,
    description: `Realizar pago de ${paymentOrder.concept || "servicio"} por ${currency}${amount}`,
  };
}
