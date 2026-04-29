/**
 * CAARD CMS - API de Configuración del Sitio
 * Soporta configuración completa del sitio
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const configSchema = z.object({
  // General
  siteName: z.string().max(100).optional().nullable(),
  siteTagline: z.string().max(200).optional().nullable(),
  siteDescription: z.string().max(500).optional().nullable(),
  favicon: z.string().optional().nullable(),

  // Branding
  logo: z.string().optional().nullable(),
  logoDark: z.string().optional().nullable(),
  logoWidth: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 180 : v).optional(),
  logoHeight: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 60 : v).optional(),

  // Colores
  primaryColor: z.string().max(20).optional().nullable(),
  secondaryColor: z.string().max(20).optional().nullable(),
  accentColor: z.string().max(20).optional().nullable(),
  backgroundColor: z.string().max(20).optional().nullable(),
  textColor: z.string().max(20).optional().nullable(),

  // Tipografía
  headingFont: z.string().max(50).optional().nullable(),
  bodyFont: z.string().max(50).optional().nullable(),
  baseFontSize: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseInt(v) || 16 : v).optional(),

  // Contacto
  phone: z.string().max(50).optional().nullable(),
  phoneSecondary: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  email: z.string().optional().nullable(),
  emailSecondary: z.string().optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),

  // Redes Sociales
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),

  // SEO
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  metaKeywords: z.string().max(300).optional().nullable(),
  ogImage: z.string().optional().nullable(),

  // Horarios
  schedule: z.string().max(200).optional().nullable(),

  // Footer
  footerText: z.string().max(500).optional().nullable(),
  showSocialInFooter: z.boolean().optional().nullable(),

  // Idiomas
  defaultLocale: z.string().max(5).optional().nullable(),
  enabledLocales: z.array(z.string()).optional().nullable(),
});

// Mapeo de campos del formulario a campos de la base de datos
function mapToDbFields(data: z.infer<typeof configSchema>) {
  return {
    siteName: data.siteName,
    siteTagline: data.siteTagline,
    logoUrl: data.logo,
    faviconUrl: data.favicon,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor,
    facebookUrl: data.facebook,
    instagramUrl: data.instagram,
    linkedinUrl: data.linkedin,
    twitterUrl: data.twitter,
    youtubeUrl: data.youtube,
    whatsappNumber: data.whatsapp,
    contactEmail: data.email,
    contactPhone: data.phone,
    // Guardar address tal cual (city y country quedan en extendedConfig).
    // Antes concatenábamos "address, city, country" y al releer el valor
    // volvía a meterse en el campo address del form, provocando
    // duplicaciones "Lima, Lima, Perú, Lima, Perú" cada vez que se
    // guardaba y el texto parecía no cambiar.
    contactAddress: data.address,
    defaultMetaTitle: data.metaTitle,
    defaultMetaDescription: data.metaDescription,
    footerText: data.footerText,
    // Campos extendidos se guardan como JSON
    extendedConfig: JSON.stringify({
      logoDark: data.logoDark,
      logoWidth: data.logoWidth,
      logoHeight: data.logoHeight,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
      headingFont: data.headingFont,
      bodyFont: data.bodyFont,
      baseFontSize: data.baseFontSize,
      phoneSecondary: data.phoneSecondary,
      emailSecondary: data.emailSecondary,
      city: data.city,
      country: data.country,
      metaKeywords: data.metaKeywords,
      ogImage: data.ogImage,
      schedule: data.schedule,
      showSocialInFooter: data.showSocialInFooter,
      defaultLocale: data.defaultLocale,
      enabledLocales: data.enabledLocales,
    }),
  };
}

// Mapeo de campos de la base de datos al formulario
function mapFromDbFields(dbConfig: any) {
  let extendedConfig: any = {};
  try {
    if (dbConfig.extendedConfig) {
      extendedConfig = JSON.parse(dbConfig.extendedConfig);
    }
  } catch (e) {
    console.error("Error parsing extendedConfig:", e);
  }

  // Extraer ciudad y país de la dirección
  let address = dbConfig.contactAddress || "";
  let city = extendedConfig.city || "";
  let country = extendedConfig.country || "";

  return {
    siteName: dbConfig.siteName || "",
    siteTagline: dbConfig.siteTagline || "",
    siteDescription: dbConfig.siteDescription || "",
    favicon: dbConfig.faviconUrl || "/favicon.ico",

    logo: dbConfig.logoUrl || "",
    logoDark: extendedConfig.logoDark || "",
    logoWidth: extendedConfig.logoWidth || 180,
    logoHeight: extendedConfig.logoHeight || 60,

    primaryColor: dbConfig.primaryColor || "#D66829",
    secondaryColor: dbConfig.secondaryColor || "#1a365d",
    accentColor: dbConfig.accentColor || "#eab308",
    backgroundColor: extendedConfig.backgroundColor || "#ffffff",
    textColor: extendedConfig.textColor || "#171717",

    headingFont: extendedConfig.headingFont || "Poppins",
    bodyFont: extendedConfig.bodyFont || "Inter",
    baseFontSize: extendedConfig.baseFontSize || 16,

    phone: dbConfig.contactPhone || "",
    phoneSecondary: extendedConfig.phoneSecondary || "",
    whatsapp: dbConfig.whatsappNumber || "",
    email: dbConfig.contactEmail || "",
    emailSecondary: extendedConfig.emailSecondary || "",
    address: address,
    city: city,
    country: country,

    facebook: dbConfig.facebookUrl || "",
    instagram: dbConfig.instagramUrl || "",
    linkedin: dbConfig.linkedinUrl || "",
    twitter: dbConfig.twitterUrl || "",
    youtube: dbConfig.youtubeUrl || "",

    metaTitle: dbConfig.defaultMetaTitle || "",
    metaDescription: dbConfig.defaultMetaDescription || "",
    metaKeywords: extendedConfig.metaKeywords || "",
    ogImage: extendedConfig.ogImage || "",

    schedule: extendedConfig.schedule || "",

    footerText: dbConfig.footerText || "",
    showSocialInFooter: extendedConfig.showSocialInFooter ?? true,

    defaultLocale: extendedConfig.defaultLocale || "es",
    enabledLocales: extendedConfig.enabledLocales || ["es", "en"],
  };
}

export async function GET() {
  try {
    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    let config = await prisma.cmsSiteConfig.findUnique({
      where: { centerId: center.id },
    });

    // Crear configuración por defecto si no existe
    if (!config) {
      config = await prisma.cmsSiteConfig.create({
        data: {
          centerId: center.id,
          siteName: center.name,
          primaryColor: center.primaryColorHex || "#D66829",
          accentColor: center.accentColorHex || "#1a365d",
        },
      });
    }

    // Retornar configuración mapeada
    return NextResponse.json(mapFromDbFields(config));
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Log para debugging
    console.log("Received config data:", JSON.stringify(body, null, 2));

    const validation = configSchema.safeParse(body);

    if (!validation.success) {
      console.error("Validation errors:", validation.error.flatten());
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
    if (!center) {
      return NextResponse.json({ error: "Centro no configurado" }, { status: 500 });
    }

    const dbData = mapToDbFields(validation.data);

    // Filtrar campos undefined
    const cleanDbData = Object.fromEntries(
      Object.entries(dbData).filter(([_, v]) => v !== undefined)
    );

    console.log("Saving to DB:", JSON.stringify(cleanDbData, null, 2));

    const config = await prisma.cmsSiteConfig.upsert({
      where: { centerId: center.id },
      update: cleanDbData,
      create: {
        centerId: center.id,
        ...cleanDbData,
      },
    });

    // Invalidar caché del sitio público para que el nuevo logo / datos
    // aparezcan inmediatamente sin esperar a que expire el cache de Vercel.
    try {
      revalidatePath("/", "layout"); // header/footer del sitio público
      revalidatePath("/");
    } catch (e) {
      console.warn("revalidatePath after config save failed:", e);
    }

    return NextResponse.json(mapFromDbFields(config));
  } catch (error: any) {
    console.error("Error updating config:", error);
    return NextResponse.json({
      error: "Error al actualizar configuración",
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Redirigir a POST para compatibilidad
  return POST(request);
}
