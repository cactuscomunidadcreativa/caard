/**
 * CAARD - API de Busqueda Avanzada de Laudos
 * GET: Busqueda con multiples filtros combinados y scoring de relevancia
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

const FULL_ACCESS_ROLES = [
  "SUPER_ADMIN", "ADMIN", "SECRETARIA", "CENTER_STAFF", "ARBITRO",
];

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`laudos:search:${ip}`, RATE_LIMITS.api);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intente mas tarde." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Filtros
    const yearFrom = searchParams.get("yearFrom");
    const yearTo = searchParams.get("yearTo");
    const subject = searchParams.get("subject");
    const arbitrationType = searchParams.get("arbitrationType");
    const claimAmountRange = searchParams.get("claimAmountRange");
    const result = searchParams.get("result");
    const arbitratorCount = searchParams.get("arbitratorCount");
    const tags = searchParams.get("tags"); // comma-separated
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page = parseInt(searchParams.get("page") || "1");

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const session = await auth();
    const userRole = session?.user?.role;
    const hasFullAccess = FULL_ACCESS_ROLES.includes(userRole || "");

    const where: any = {
      centerId: center.id,
      isPublished: hasFullAccess ? undefined : true,
    };

    // Filtro por rango de anios
    if (yearFrom || yearTo) {
      where.year = {};
      if (yearFrom) where.year.gte = parseInt(yearFrom);
      if (yearTo) where.year.lte = parseInt(yearTo);
    }

    if (subject) {
      where.subject = { contains: subject, mode: "insensitive" };
    }

    if (arbitrationType) {
      where.arbitrationType = { contains: arbitrationType, mode: "insensitive" };
    }

    if (claimAmountRange) {
      where.claimAmountRange = { contains: claimAmountRange, mode: "insensitive" };
    }

    if (result) {
      where.result = { contains: result, mode: "insensitive" };
    }

    if (arbitratorCount) {
      where.arbitratorCount = parseInt(arbitratorCount);
    }

    // Busqueda por texto libre
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
        { subject: { contains: query, mode: "insensitive" } },
        { arbitrationType: { contains: query, mode: "insensitive" } },
        { result: { contains: query, mode: "insensitive" } },
      ];
    }

    // Limpiar undefined del where (isPublished)
    if (where.isPublished === undefined) {
      delete where.isPublished;
    }

    const [results, total] = await Promise.all([
      prisma.laudo.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [
          { isFeatured: "desc" },
          { year: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.laudo.count({ where }),
    ]);

    // Calcular relevancia y filtrar por tags (post-query ya que tags es JSON)
    let scoredResults = results.map((laudo) => {
      let relevanceScore = 0;

      // Scoring basico
      if (laudo.isFeatured) relevanceScore += 10;
      if (query) {
        if (laudo.title.toLowerCase().includes(query.toLowerCase())) relevanceScore += 5;
        if (laudo.summary?.toLowerCase().includes(query.toLowerCase())) relevanceScore += 3;
        if (laudo.subject?.toLowerCase().includes(query.toLowerCase())) relevanceScore += 4;
        if (laudo.arbitrationType?.toLowerCase().includes(query.toLowerCase())) relevanceScore += 3;
      }
      // Laudos mas recientes tienen mayor relevancia
      if (laudo.year) {
        relevanceScore += Math.max(0, (laudo.year - 2000) / 5);
      }
      if (laudo.downloadCount > 0) {
        relevanceScore += Math.min(laudo.downloadCount / 10, 5);
      }

      return { ...laudo, relevanceScore: Math.round(relevanceScore * 100) / 100 };
    });

    // Filtrar por tags (JSON field, post-query filtering)
    if (tags) {
      const requestedTags = tags.split(",").map((t) => t.trim().toLowerCase());
      scoredResults = scoredResults.filter((laudo) => {
        const laudoTags = Array.isArray(laudo.tags)
          ? (laudo.tags as string[]).map((t) => t.toLowerCase())
          : [];
        return requestedTags.some((tag) => laudoTags.includes(tag));
      });
    }

    // Ordenar por relevancia
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Ocultar fullPdfUrl para laudos PREMIUM sin acceso
    const items = scoredResults.map((laudo) => {
      if (laudo.accessLevel === "PREMIUM" && !hasFullAccess) {
        const { fullPdfUrl, ...rest } = laudo;
        return rest;
      }
      return laudo;
    });

    return NextResponse.json({
      items,
      total: tags ? items.length : total,
      page,
      pageSize: limit,
      totalPages: Math.ceil((tags ? items.length : total) / limit),
      filters: {
        yearFrom: yearFrom ? parseInt(yearFrom) : null,
        yearTo: yearTo ? parseInt(yearTo) : null,
        subject,
        arbitrationType,
        claimAmountRange,
        result,
        arbitratorCount: arbitratorCount ? parseInt(arbitratorCount) : null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : null,
        q: query,
      },
    });
  } catch (error) {
    console.error("Error searching laudos:", error);
    return NextResponse.json({ error: "Error al buscar laudos" }, { status: 500 });
  }
}
