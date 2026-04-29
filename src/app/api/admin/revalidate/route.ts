/**
 * POST /api/admin/revalidate
 * Body: { path?: string, all?: boolean }
 *
 * Permite al admin invalidar manualmente el cache CDN de una página
 * pública (o todo el sitio) cuando un cambio del CMS no se refleja.
 * Solo SUPER_ADMIN / ADMIN.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const COMMON_PATHS = [
  "/",
  "/contacto",
  "/arbitraje",
  "/presentacion",
  "/secretaria-general",
  "/consejo-superior",
  "/sedes",
  "/eventos",
  "/cursos",
  "/tienda",
  "/laudos",
  "/arbitros",
  "/blog",
  "/registro-arbitros",
  "/solicitud-arbitral",
  "/arbitraje-emergencia",
  "/reglamentos",
  "/preguntas-frecuentes",
  "/politica-privacidad",
  "/terminos-condiciones",
  "/libro-de-reclamaciones",
  "/calculadora",
  "/clausula-arbitral",
  "/transparencia",
  "/servicios-ad-hoc",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { path, all } = body || {};

    const pathsToRevalidate: string[] = [];
    if (all) {
      pathsToRevalidate.push(...COMMON_PATHS);
    } else if (path && typeof path === "string") {
      pathsToRevalidate.push(path);
    } else {
      pathsToRevalidate.push("/");
    }

    for (const p of pathsToRevalidate) {
      try {
        revalidatePath(p, "layout");
        revalidatePath(p);
      } catch (e) {
        console.warn(`revalidatePath failed for ${p}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: pathsToRevalidate,
    });
  } catch (e: any) {
    console.error("revalidate API error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al revalidar" },
      { status: 500 }
    );
  }
}
