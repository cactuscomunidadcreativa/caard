/**
 * CAARD - Layout del sitio web público
 * Incluye header, footer, botón de WhatsApp y traducción
 */

import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/cms/website-header";
import { WebsiteFooter } from "@/components/cms/website-footer";
import { WhatsAppButton } from "@/components/cms/whatsapp-button";
import { PublicChatbot } from "@/components/ai/public-chatbot";
import { AntiCopy } from "@/components/anti-copy";

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

      {/* Protección anti-copia */}
      <AntiCopy />

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
