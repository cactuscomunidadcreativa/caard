import * as XLSX from "xlsx";
import fs from "fs";

const files = [
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (1).xlsx",
  "/Users/eduardogonzalez/Downloads/CAARD_Plantilla_Completa (2).xlsx",
];

function parse(file) {
  const wb = XLSX.read(fs.readFileSync(file), { type: "buffer", cellDates: true });
  const out = {};
  for (const sn of wb.SheetNames) {
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: null, raw: false });
    // raw[0] is the description, raw[1] is headers, raw[2..] is data
    const headers = raw[1] || [];
    const dataRows = raw.slice(2).filter(r => r.some(c => c !== null && c !== ""));
    out[sn] = { headers, rows: dataRows };
  }
  return out;
}

const a = parse(files[0]);
const b = parse(files[1]);

console.log("Sheet | file1 rows | file2 rows");
console.log("-".repeat(50));
for (const sn of Object.keys(a)) {
  console.log(`${sn.padEnd(25)} ${String(a[sn].rows.length).padStart(5)}  ${String(b[sn].rows.length).padStart(5)}`);
}
