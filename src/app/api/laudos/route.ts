/**
 * CAARD - API de Laudos (Biblioteca de Laudos Arbitrales)
 * GET: Listar laudos con filtros y paginacion
 * POST: Crear laudo (requiere autenticacion)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const createLaudoSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(500),
  summary: z.string().max(2000).optional(),
  fullPdfUrl: z.string().url().optional(),
  accessLevel: z.enum(["FREE", "PREMIUM"]).optional(),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.enum(["PEN", "USD"]).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  arbitrationType: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  claimAmountRange: z.string().max(100).optional(),
  result: z.string().max(200).optional(),
  arbitratorCount: z.number().int().min(1).max(5).optional(),
  isAnonymized: z.boolean().optional(),
  pageCount: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`laudos:list:${ip}`, RATE_LIMITS.api);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intente mas tarde." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accessLevel = searchParams.get("accessLevel");
    const year = searchParams.get("year");
    const subject = searchParams.get("subject");
    const arbitrationType = searchParams.get("arbitrationType");
    const result = searchParams.get("result");
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    const published = searchParams.get("published");
    const featured = searchParams.get("featured") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page = parseInt(searchParams.get("page") || "1");

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Obtener sesion para determinar nivel de acceso
    const session = await auth();
    const userRole = session?.user?.role;
    const hasFullAccess = [
      "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "ARBITRO",
    ].includes(userRole || "");

    const where: any = { centerId: center.id };

    // Por defecto, solo publicados para usuarios sin privilegios
    if (published !== "false" && !hasFullAccess) {
      where.isPublished = true;
    } else if (published === "true") {
      where.isPublished = true;
    }

    if (accessLevel) where.accessLevel = accessLevel;
    if (year) where.year = parseInt(year);
    if (subject) where.subject = { contains: subject, mode: "insensitive" };
    if (arbitrationType) where.arbitrationType = { contains: arbitrationType, mode: "insensitive" };
    if (result) where.result = { contains: result, mode: "insensitive" };
    if (categoryId) where.categoryId = categoryId;
    if (featured) where.isFeatured = true;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { arbitrationType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [laudos, total] = await Promise.all([
      prisma.laudo.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.laudo.count({ where }),
    ]);

    // Ocultar fullPdfUrl para laudos PREMIUM si el usuario no tiene acceso
    const items = laudos.map((laudo) => {
      if (laudo.accessLevel === "PREMIUM" && !hasFullAccess) {
        const { fullPdfUrl, ...rest } = laudo;
        return rest;
      }
      return laudo;
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching laudos:", error);
    return NextResponse.json({ error: "Error al obtener laudos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !["SUPER_ADMIN", "ADMIN", "SECRETARIA"].includes(session.user.role || "")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createLaudoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    // Verificar slug unico
    const existing = await prisma.laudo.findUnique({
      where: { centerId_slug: { centerId: center.id, slug: data.slug } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un laudo con ese slug" },
        { status: 400 }
      );
    }

    const laudo = await prisma.laudo.create({
      data: {
        centerId: center.id,
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        fullPdfUrl: data.fullPdfUrl,
        accessLevel: data.accessLevel || "FREE",
        priceCents: data.priceCents,
        currency: data.currency || "PEN",
        year: data.year,
        arbitrationType: data.arbitrationType,
        subject: data.subject,
        claimAmountRange: data.claimAmountRange,
        result: data.result,
        arbitratorCount: data.arbitratorCount,
        isAnonymized: data.isAnonymized ?? true,
        pageCount: data.pageCount,
        tags: data.tags || [],
        categoryId: data.categoryId,
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(laudo, { status: 201 });
  } catch (error) {
    console.error("Error creating laudo:", error);
    return NextResponse.json({ error: "Error al crear laudo" }, { status: 500 });
  }
}
