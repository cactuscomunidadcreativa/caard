/**
 * GET /api/holidays - Lista feriados
 * POST /api/holidays - Crear feriado
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(
      holidays.map((h) => ({
        id: h.id,
        date: h.date.toISOString().split("T")[0],
        name: h.name,
        description: h.description,
        isNational: h.isNational,
        isRecurring: h.isRecurring,
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const body = await req.json();
    const center = await prisma.center.findFirst();
    const h = await prisma.holiday.create({
      data: {
        centerId: center?.id,
        date: new Date(body.date),
        name: body.name,
        description: body.description || null,
        isNational: body.isNational ?? true,
        isRecurring: body.isRecurring ?? false,
      },
    });
    return NextResponse.json({ id: h.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
