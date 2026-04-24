/**
 * API del perfil del árbitro autenticado.
 * GET: devuelve el perfil del árbitro actual (crea registry+profile si no existen)
 * PATCH: actualiza campos del perfil
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function getOrCreateProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, centerId: true },
  });
  if (!user) return null;

  // Buscar o crear registry
  let registry = await prisma.arbitratorRegistry.findUnique({
    where: { userId },
    include: { profile: true },
  });

  if (!registry) {
    if (!user.centerId) return null;
    // NUEVO: los nuevos registros entran como PENDING_APPROVAL y requieren
    // que secretaría/admin los active. Antes quedaban ACTIVE automáticamente
    // lo que saltaba el flujo de validación del Consejo Superior.
    registry = await prisma.arbitratorRegistry.create({
      data: {
        userId,
        centerId: user.centerId,
        status: "PENDING_APPROVAL",
      },
      include: { profile: true },
    });
  }

  if (!registry.profile) {
    const baseSlug = slugify(user.name || user.email || "arbitro");
    let slug = baseSlug;
    let i = 2;
    while (await prisma.arbitratorProfile.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }
    const profile = await prisma.arbitratorProfile.create({
      data: {
        registryId: registry.id,
        slug,
        displayName: user.name || user.email || "Árbitro",
        contactEmail: user.email,
      },
    });
    return { registry, profile };
  }
  return { registry, profile: registry.profile };
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Permitir a árbitros y staff ver/editar
    if (!["ARBITRO", "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const result = await getOrCreateProfile(session.user.id);
    if (!result) {
      return NextResponse.json(
        { error: "No se pudo obtener o crear el perfil" },
        { status: 500 }
      );
    }

    // Fusionar processesHistory con los casos reales de CAARD.
    // Los casos de CAARD son autoritativos (no editables); los externos se
    // añaden debajo y el árbitro puede gestionarlos libremente.
    const { mergeCaardAndManualProcesses, getArbitratorStats } = await import(
      "@/lib/arbitrator-stats"
    );
    const mergedHistory = await mergeCaardAndManualProcesses(
      session.user.id,
      result.profile.processesHistory
    );
    const stats = await getArbitratorStats({ registryId: result.registry.id });

    return NextResponse.json({
      profile: {
        ...result.profile,
        processesHistory: mergedHistory,
      },
      registry: {
        id: result.registry.id,
        status: result.registry.status,
        barNumber: result.registry.barNumber,
        barAssociation: result.registry.barAssociation,
        // Stats reales (sirven al árbitro para ver su volumen sin contar manualmente)
        stats,
      },
    });
  } catch (e: any) {
    console.error("GET /arbitrators/profile error:", e);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!["ARBITRO", "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const result = await getOrCreateProfile(session.user.id);
    if (!result) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const allowed: Record<string, boolean> = {
      displayName: true,
      title: true,
      photoUrl: true,
      biography: true,
      contactEmail: true,
      phone: true,
      linkedinUrl: true,
      colegiatura: true,
      colegio: true,
      rnaNumber: true,
      especialidad: true,
      specializations: true,
      yearsExperience: true,
      affiliatedCenters: true,
      education: true,
      experience: true,
      publications: true,
      languages: true,
      cvDocumentUrl: true,
      rnaDocumentUrl: true,
      contraloriaDocumentUrl: true,
      otherDocuments: true,
      availableForCases: true,
      availabilityNotes: true,
      independenceDeclaration: true,
      processesHistory: true,
      isPublished: true,
    };

    const data: any = {};
    for (const key of Object.keys(body)) {
      if (allowed[key]) data[key] = body[key];
    }

    // Al persistir processesHistory, filtrar los casos de CAARD (se calculan
    // en tiempo real). Sólo guardamos los externos que el árbitro agregó manualmente.
    if (Array.isArray(data.processesHistory)) {
      data.processesHistory = data.processesHistory.filter(
        (p: any) => !p?.isCaardCase
      );
    }

    const updated = await prisma.arbitratorProfile.update({
      where: { id: result.profile.id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "ArbitratorProfile",
        entityId: result.profile.id,
        userId: session.user.id,
        meta: { fields: Object.keys(data) },
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (e: any) {
    console.error("PATCH /arbitrators/profile error:", e);
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
