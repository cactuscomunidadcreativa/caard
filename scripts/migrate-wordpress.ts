/**
 * CAARD - Migración desde WordPress XML
 * Importa páginas, posts, attachments del WordPress viejo
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { XMLParser } from "fast-xml-parser";

const p = new PrismaClient();

const XML_PATH = "/Users/eduardogonzalez/Downloads/caard.WordPress.2026-04-07.xml";
const UPLOADS_DIR = path.join(process.cwd(), "public/uploads/wp-import");

interface WPItem {
  title: string;
  link: string;
  pubDate: string;
  "wp:post_id": number;
  "wp:post_name": string;
  "wp:post_type": string;
  "wp:status": string;
  "wp:post_date": string;
  "wp:post_parent": number;
  "wp:menu_order": number;
  "wp:attachment_url"?: string;
  "content:encoded": string;
  "excerpt:encoded": string;
  category?: any;
}

function decodeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) {
      resolve(true);
      return;
    }
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          resolve(false);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(true);
        });
      })
      .on("error", () => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        resolve(false);
      });
  });
}

async function main() {
  console.log("=== Migración WordPress → CAARD nuevo ===\n");

  // 1. Parse XML
  const xml = fs.readFileSync(XML_PATH, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    parseTagValue: false,
  });
  const data = parser.parse(xml);

  const items: WPItem[] = data.rss.channel.item || [];
  console.log(`Total items en XML: ${items.length}`);

  // Get center
  const center = await p.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No center");

  // Get default user (super admin) for authorship
  const author = await p.user.findFirst({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
  });
  if (!author) throw new Error("No author");

  // 2. Process attachments first (images, PDFs)
  const attachments = items.filter((i) => i["wp:post_type"] === "attachment");
  console.log(`\n📎 Procesando ${attachments.length} attachments...`);

  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  let downloadedCount = 0;
  let mediaCreated = 0;
  const urlMap = new Map<string, string>(); // wp url -> new url

  for (const att of attachments) {
    const wpUrl = att["wp:attachment_url"] || "";
    if (!wpUrl) continue;

    const filename = path.basename(wpUrl);
    const localPath = path.join(UPLOADS_DIR, filename);
    const newUrl = `/uploads/wp-import/${filename}`;

    // Download
    const ok = await downloadFile(wpUrl, localPath);
    if (ok) {
      downloadedCount++;
      urlMap.set(wpUrl, newUrl);

      // Create CmsMedia entry
      try {
        const stats = fs.statSync(localPath);
        const ext = path.extname(filename).toLowerCase();
        const mimeType =
          {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
            ".pdf": "application/pdf",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
          }[ext] || "application/octet-stream";

        await p.cmsMedia.upsert({
          where: { centerId_filename: { centerId: center.id, filename } },
          update: { url: newUrl },
          create: {
            centerId: center.id,
            filename,
            originalName: att.title || filename,
            mimeType,
            size: stats.size,
            url: newUrl,
            uploadedById: author.id,
            folder: "wp-import",
          },
        });
        mediaCreated++;
      } catch (e: any) {
        // Skip errors (probably duplicate or schema mismatch)
      }
    }
  }
  console.log(`  ✓ Descargados: ${downloadedCount}/${attachments.length}`);
  console.log(`  ✓ CmsMedia creados: ${mediaCreated}`);

  // 3. Process posts → CmsArticle
  const posts = items.filter((i) => i["wp:post_type"] === "post" && i["wp:status"] === "publish");
  console.log(`\n📝 Procesando ${posts.length} posts...`);

  let articlesCreated = 0;
  for (const post of posts) {
    const title = post.title || "Sin título";
    const slug = post["wp:post_name"] || title.toLowerCase().replace(/\s+/g, "-");
    let content = post["content:encoded"] || "";
    content = decodeHtml(typeof content === "object" ? (content as any).__cdata || "" : content);

    // Replace WP URLs with new URLs in content
    for (const [wpUrl, newUrl] of urlMap.entries()) {
      content = content.split(wpUrl).join(newUrl);
    }

    let excerpt = post["excerpt:encoded"] || "";
    excerpt = decodeHtml(typeof excerpt === "object" ? (excerpt as any).__cdata || "" : excerpt);

    try {
      await p.cmsArticle.upsert({
        where: { centerId_slug: { centerId: center.id, slug } },
        update: {
          title,
          content,
          excerpt: excerpt.slice(0, 500),
        },
        create: {
          centerId: center.id,
          slug,
          title,
          content,
          excerpt: excerpt.slice(0, 500),
          authorId: author.id,
          isPublished: true,
          publishedAt: new Date(post["wp:post_date"]),
        },
      });
      articlesCreated++;
      console.log(`  ✓ "${title}"`);
    } catch (e: any) {
      console.log(`  ✗ "${title}": ${e.message}`);
    }
  }
  console.log(`  Total artículos: ${articlesCreated}`);

  // 4. Process pages → CmsPage
  const pages = items.filter(
    (i) => i["wp:post_type"] === "page" && i["wp:status"] === "publish" && i["wp:post_name"] !== "pagina-en-construccion"
  );
  console.log(`\n📄 Procesando ${pages.length} páginas...`);

  let pagesUpdated = 0;
  let pagesCreated = 0;
  for (const page of pages) {
    const title = page.title || "Sin título";
    const slug = page["wp:post_name"] || title.toLowerCase().replace(/\s+/g, "-");
    let content = page["content:encoded"] || "";
    content = decodeHtml(typeof content === "object" ? (content as any).__cdata || "" : content);

    // Replace URLs
    for (const [wpUrl, newUrl] of urlMap.entries()) {
      content = content.split(wpUrl).join(newUrl);
    }

    // Strip Elementor shortcodes
    content = content.replace(/\[\/?et_pb[^\]]*\]/g, "");

    try {
      const existing = await p.cmsPage.findUnique({
        where: { centerId_slug: { centerId: center.id, slug } },
      });

      if (existing) {
        // Page exists - just update meta, don't overwrite
        await p.cmsPage.update({
          where: { id: existing.id },
          data: {
            metaTitle: title,
          },
        });
        pagesUpdated++;
        console.log(`  ↻ "${title}" (ya existía, actualizado meta)`);
      } else {
        // Create new page with content as a single TEXT section
        const newPage = await p.cmsPage.create({
          data: {
            centerId: center.id,
            slug,
            title,
            metaTitle: title,
            isPublished: true,
            publishedAt: new Date(page["wp:post_date"]),
          },
        });

        // Create a TEXT section with the content
        if (content.trim()) {
          await p.cmsSection.create({
            data: {
              pageId: newPage.id,
              type: "TEXT",
              title: title,
              content: { html: content },
              sortOrder: 0,
              isVisible: true,
            },
          });
        }
        pagesCreated++;
        console.log(`  + "${title}" (nueva)`);
      }
    } catch (e: any) {
      console.log(`  ✗ "${title}": ${e.message}`);
    }
  }
  console.log(`  Páginas actualizadas: ${pagesUpdated}`);
  console.log(`  Páginas creadas: ${pagesCreated}`);

  // 5. Final stats
  const totalMedia = await p.cmsMedia.count({ where: { centerId: center.id } });
  const totalArticles = await p.cmsArticle.count({ where: { centerId: center.id } });
  const totalPages = await p.cmsPage.count({ where: { centerId: center.id } });

  console.log(`\n=== ESTADO FINAL ===`);
  console.log(`Total media: ${totalMedia}`);
  console.log(`Total artículos: ${totalArticles}`);
  console.log(`Total páginas: ${totalPages}`);

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
