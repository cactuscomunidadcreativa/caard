/**
 * GET/PUT /api/admin/plazos-config
 * Lee/guarda overrides de plazos reglamentarios en Center.notificationSettings.plazosOverrides
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const center = await prisma.center.findFirst({ select: { notificationSettings: true } });
    const settings = (center?.notificationSettings as any) || {};
    return NextResponse.json({ overrides: settings.plazosOverrides || {} });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const body = await req.json();
    const center = await prisma.center.findFirst();
    if (!center) return NextResponse.json({ error: "No center" }, { status: 500 });
    const current = (center.notificationSettings as any) || {};
    await prisma.center.update({
      where: { id: center.id },
      data: {
        notificationSettings: {
          ...current,
          plazosOverrides: body.overrides || {},
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
