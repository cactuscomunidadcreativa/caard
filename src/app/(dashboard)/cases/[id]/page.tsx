/**
 * CAARD - Detalle de Expediente (Server Component)
 * /cases/[id] - Vista completa del expediente con todas sus relaciones
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import CaseDetailClient from "./case-detail-client";

// Utility to serialize BigInt and Date values for client component
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

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      center: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      arbitrationType: {
        select: {
          id: true,
          code: true,
          name: true,
          kind: true,
          tribunalMode: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      lawyers: {
        where: { isActive: true },
        include: {
          lawyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          representedMember: {
            select: {
              id: true,
              displayName: true,
              role: true,
            },
          },
        },
      },
      folders: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      documents: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
          folder: {
            select: { id: true, key: true, name: true },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      paymentOrders: {
        orderBy: { issuedAt: "desc" },
      },
      deadlines: {
        orderBy: { dueAt: "asc" },
      },
      processDeadlines: {
        orderBy: { dueAt: "asc" },
      },
      hearings: {
        orderBy: { hearingAt: "asc" },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!caseData) {
    notFound();
  }

  const serialized = serializeForClient(caseData);

  return (
    <CaseDetailClient
      caseData={serialized as any}
      userId={session.user.id}
      userRole={session.user.role}
    />
  );
}
