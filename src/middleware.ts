/**
 * CAARD - Middleware para protección de rutas y seguridad
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/public",
  "/api/cms/media", // proxy público de archivos CMS (/api/cms/media/[id]/file)
  "/api/cms/announcements", // banners públicos
  "/api/cms/sections", // secciones de páginas públicas
  "/api/cms/config", // config del sitio (logo, colores)
  "/api/cms/menu", // menú público
  "/api/cms/hero-images", // hero images (GET público, PUT validado internamente)
  "/api/cms/articles", // artículos públicos
  "/api/cms/events", // eventos públicos
  "/api/cms/courses", // cursos públicos
  "/api/cms/pages", // páginas CMS públicas
  "/api/cms/arbitrators", // árbitros públicos
  "/api/cms/categories", // categorías públicas
  "/api/cms/documents", // documentos/reglamentos públicos
  "/pago", // Páginas de pago público
  // Páginas públicas del website (CMS)
  "/presentacion",
  "/secretaria-general",
  "/consejo-superior",
  "/sedes",
  "/arbitraje",
  "/arbitraje-emergencia",
  "/servicios-ad-hoc",
  "/registro-arbitros",
  "/reglamentos",
  "/clausula-arbitral",
  "/calculadora",
  "/contacto",
  "/solicitud-arbitral",
  "/noticias",
  "/eventos",
  "/articulos",
  "/nosotros",
  "/servicios",
  "/mediacion",
  "/arancelario",
  "/reglamento",
  "/faqs",
  "/transparencia",
  "/politica-privacidad",
  "/terminos-condiciones",
  // Módulos comerciales públicos
  "/cursos",
  "/tienda",
  "/carrito",
  "/checkout",
  "/laudos",
  "/arbitros",
  "/l",        // Landing pages
];

// Rutas que requieren rol de admin
const adminRoutes = ["/admin"];

// Rutas que requieren rol de secretaría o superior
const staffRoutes = ["/secretaria", "/staff"];

/**
 * Agrega security headers a cualquier respuesta
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Permitir archivos estáticos y API routes públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/patterns") ||
    pathname.includes(".")
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Verificar autenticación para rutas protegidas
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = req.auth.user.role;

  // Verificar acceso a rutas de admin
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const adminAllowedRoles = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"];
    if (!adminAllowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Verificar acceso a rutas de staff (secretaría)
  if (staffRoutes.some((route) => pathname.startsWith(route))) {
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
