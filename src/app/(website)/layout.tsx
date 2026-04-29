/**
 * CAARD - Layout del sitio web público
 * Incluye header, footer, botón de WhatsApp y traducción
 */

import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/cms/website-header";
import { WebsiteFooter } from "@/components/cms/website-footer";
import { WhatsAppButton } from "@/components/cms/whatsapp-button";
import { PublicChatbot } from "@/components/ai/public-chatbot";
// AntiCopy ya está en root layout

// El header lee logo, nombre, contacto y menú desde el CMS. Si Vercel
// cachea estáticamente el layout, los cambios del admin tardan horas en
// aparecer. Forzamos render dinámico para que siempre se lea la última
// configuración (la consulta a Prisma es trivial — un único findUnique
// por centro).
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SiteConfig {
  siteName?: string | null;
  siteTagline?: string | null;
  logoUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  whatsappNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  footerText?: string | null;
  copyrightText?: string | null;
}

async function getWebsiteData(): Promise<{ menuItems: any[]; config: SiteConfig }> {
  const center = await prisma.center.findFirst({ where: { code: "CAARD" } });
  if (!center) return { menuItems: [], config: {} };

  const [menuItems, config] = await Promise.all([
    prisma.cmsMenuItem.findMany({
      where: { centerId: center.id, parentId: null, isVisible: true },
      include: {
        children: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.cmsSiteConfig.findUnique({ where: { centerId: center.id } }),
  ]);

  // logoDark vive en extendedConfig (JSON). El header/footer son client
  // components y lo cargan ellos mismos vía /api/cms/config para evitar
  // pasar campos no-serializables (Date) desde el server component.
  return { menuItems, config: config || {} };
}

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { menuItems, config } = await getWebsiteData();

  // Número de WhatsApp por defecto si no está configurado
  const whatsappNumber = config.whatsappNumber || "+51913755003";

  return (
    <>
      <WebsiteHeader
        menuItems={menuItems}
        siteName={config.siteName || "CAARD"}
        logoUrl={config.logoUrl || undefined}
        config={config}
      />
      <main>{children}</main>
      <WebsiteFooter config={config} />

      {/* Chatbot público con IA */}
      <PublicChatbot />

      {/* Botón flotante de WhatsApp */}
      <WhatsAppButton
        phoneNumber={whatsappNumber}
        message="Hola, me gustaría obtener información sobre los servicios de arbitraje de CAARD."
      />
    </>
  );
}
