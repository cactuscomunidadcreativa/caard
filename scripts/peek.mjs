import * as XLSX from "xlsx";
import fs from "fs";

const file = "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (1).xlsx";
const wb = XLSX.read(fs.readFileSync(file), { type: "buffer", cellDates: true });
const sheets = ["01_Expedientes", "02_Miembros", "04_Arbitros", "10_Usuarios", "05_Plazos", "06_Audiencias", "08_OrdenesPago", "11_Feriados", "03_Abogados"];
for (const sn of sheets) {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: null, raw: false });
  const headers = raw[1] || [];
  const rows = raw.slice(2).filter(r => r.some(c => c !== null && c !== ""));
  console.log(`\n=== ${sn} (${rows.length} rows) ===`);
  console.log("Headers:", headers.map((h,i)=>`[${i}]${h}`).join(" | "));
  if (rows[0]) console.log("Row 0:", rows[0].map((c,i)=>`[${i}]${String(c).slice(0,40)}`).join(" | "));
  if (rows[1]) console.log("Row 1:", rows[1].map((c,i)=>`[${i}]${String(c).slice(0,40)}`).join(" | "));
}
// Look for administracion@caardpe.com
console.log("\n=== Busqueda administracion@caardpe.com ===");
const users = XLSX.utils.sheet_to_json(wb.Sheets["10_Usuarios"], { header: 1, defval: null, raw: false });
const hits = users.slice(2).filter(r => r.some(c => String(c||"").toLowerCase().includes("administracion")));
console.log("Rows found:", hits.length);
hits.forEach(r => console.log(r));
