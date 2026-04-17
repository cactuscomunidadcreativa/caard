/**
 * GET /api/arbitrators/registry-by-user/[userId]
 * Devuelve el ArbitratorRegistry asociado a un user específico (lookup).
 * Usado para presentar recusaciones (se necesita el registryId, no el userId).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { userId } = await params;
    const registry = await prisma.arbitratorRegistry.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    return NextResponse.json({ registry });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
