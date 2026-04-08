/**
 * Mueve todas las carpetas "Exp. XXX" que están sueltas en la raíz de SCA CAARD
 * a su carpeta de año correspondiente.
 */
import { prisma } from "../src/lib/prisma";
import { google } from "googleapis";

const SCA_CAARD = "1muHi99MxtkhfG9KswQWmP2rgtPzUaaL2";

async function main() {
  const center = await prisma.center.findFirst({ select: { notificationSettings: true } });
  const rt = (center?.notificationSettings as any)?.googleRefreshToken;
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "https://caardpe.com"}/api/integrations/google/callback`
  );
  oauth.setCredentials({ refresh_token: rt });
  const drive = google.drive({ version: "v3", auth: oauth });

  async function findOrCreate(name: string, parent: string): Promise<string> {
    const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`;
    const r = await drive.files.list({ q, fields: "files(id)", pageSize: 1 });
    if (r.data.files && r.data.files[0]) return r.data.files[0].id!;
    const c = await drive.files.create({
      requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
      fields: "id",
    });
    return c.data.id!;
  }

  // list children of SCA CAARD
  const r = await drive.files.list({
    q: `'${SCA_CAARD}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
    fields: "files(id,name)",
    pageSize: 1000,
  });
  const all = r.data.files || [];
  const yearRegex = /^\d{4}$/;
  const expFolders = all.filter((f) => !yearRegex.test(f.name!));
  console.log(`Carpetas de caso sueltas en raíz: ${expFolders.length}`);

  const yearCache = new Map<string, string>();
  let moved = 0;
  for (const f of expFolders) {
    // Extract year from name: "Exp. 008-2025-ARB_CAARD" → 2025
    const m = f.name!.match(/-(\d{4})-/);
    const year = m ? m[1] : "sin-año";
    let yearId = yearCache.get(year);
    if (!yearId) {
      yearId = await findOrCreate(year, SCA_CAARD);
      yearCache.set(year, yearId);
    }
    try {
      await drive.files.update({
        fileId: f.id!,
        addParents: yearId,
        removeParents: SCA_CAARD,
        fields: "id,parents",
      });
      moved++;
      console.log(`[${moved}] ${f.name} → ${year}/`);
    } catch (e: any) {
      console.warn(`  error ${f.name}: ${e.message}`);
    }
  }
  console.log(`\nMovidas: ${moved}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
