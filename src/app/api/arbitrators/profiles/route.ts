/**
 * CAARD - API de Perfiles de Árbitros
 * GET: Listar perfiles publicados
 * POST: Crear perfil para un árbitro del registro
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProfileSchema = z.object({
  registryId: z.string(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1).max(200),
  title: z.string().max(300).optional(),
  photoUrl: z.string().url().optional(),
  biography: z.string().optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number().optional(),
  })).optional(),
  experience: z.array(z.object({
    position: z.string(),
    organization: z.string(),
    period: z.string().optional(),
  })).optional(),
  publications: z.array(z.object({
    title: z.string(),
    publisher: z.string().optional(),
    year: z.number().optional(),
    url: z.string().optional(),
  })).optional(),
  languages: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional(),
  linkedinUrl: z.string().url().optional(),
  yearsExperience: z.number().int().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published") !== "false";
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");

    const where: any = {};
    if (published) where.isPublished = true;
    if (featured) where.isFeatured = true;
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { biography: { contains: search, mode: "insensitive" } },
      ];
    }

    const profiles = await prisma.arbitratorProfile.findMany({
      where,
      include: {
        registry: {
          select: {
            id: true,
            status: true,
            specializations: true,
            acceptsEmergency: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { displayName: "asc" },
    });

    // Inyectar stats reales (no usamos los campos manuales del registry)
    const { getArbitratorStats } = await import("@/lib/arbitrator-stats");
    const items = await Promise.all(
      profiles.map(async (pr) => {
        const stats = await getArbitratorStats({ registryId: pr.registry.id });
        return {
          ...pr,
          registry: {
            ...pr.registry,
            casesCompleted: stats.closedCases,
            casesAssigned: stats.totalCases,
            casesInProgress: stats.activeCases,
          },
        };
      })
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json({ error: "Error al obtener perfiles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos", details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    // Verificar que el registro existe
    const registry = await prisma.arbitratorRegistry.findUnique({
      where: { id: data.registryId },
    });
    if (!registry) {
      return NextResponse.json({ error: "Registro de árbitro no encontrado" }, { status: 404 });
    }

    // Verificar slug único
    const existing = await prisma.arbitratorProfile.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un perfil con ese slug" }, { status: 400 });
    }

    const profile = await prisma.arbitratorProfile.create({
      data: {
        registryId: data.registryId,
        slug: data.slug,
        displayName: data.displayName,
        title: data.title,
        photoUrl: data.photoUrl,
        biography: data.biography,
        education: data.education || [],
        experience: data.experience || [],
        publications: data.publications || [],
        languages: data.languages || [],
        contactEmail: data.contactEmail,
        linkedinUrl: data.linkedinUrl,
        yearsExperience: data.yearsExperience,
        laudosCount: registry.casesCompleted,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Error al crear perfil" }, { status: 500 });
  }
}
