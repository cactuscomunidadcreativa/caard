import * as XLSX from "xlsx";
import fs from "fs";
const files = [
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (1).xlsx",
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (2).xlsx",
];
for (const f of files) {
  const buf = fs.readFileSync(f);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  console.log("\n=== FILE:", f);
  console.log("Sheets:", wb.SheetNames);
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
    console.log(`\n--- Sheet: "${sn}" — ${rows.length} rows`);
    if (rows.length > 0) {
      console.log("Columns:", Object.keys(rows[0]));
      // Show first 2 rows
      rows.slice(0, 2).forEach((r, i) => console.log(`  row ${i+1}:`, JSON.stringify(r).slice(0, 400)));
    }
  }
}
