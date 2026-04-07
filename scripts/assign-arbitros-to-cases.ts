/**
 * CAARD - Asignar árbitros a expedientes desde Cuadros de Honorarios
 * Lee los nombres extraídos del Excel y los matchea con los árbitros existentes
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";

const p = new PrismaClient();

// Mapeo de nombres del Excel (variantes/typos) -> nombre canónico
const NAME_NORMALIZER: Record<string, string> = {
  "ahmed manyari": "Ahmed Manyari Zea",
  "albereto montezuma": "Alberto Montezuma Chirinos",
  "alberto montezuma": "Alberto Montezuma Chirinos",
  "alberto retamozo": "Alberto Retamozo Linares",
  "alvaro carrera": "Alvaro Rodrigo Carrera Dongo",
  "andres criado": "Andrés Augusto Criado León",
  "alonso bedoya denegri": "Alonso Bedoya Denegri",
  "augusto millones santa gadea": "Augusto Millones Santa Gadea",
  "carlos alvarez": "Carlos Enrique Alvarez Solis",
  "carlos enrique alvarez solis": "Carlos Enrique Alvarez Solis",
  "carlos armas": "Carlos Armas",
  "cesar santillan": "César Eduardo Santillán Salazar",
  "cesar eduardo santillan salazar": "César Eduardo Santillán Salazar",
  "césar eduardo santillán salazar": "César Eduardo Santillán Salazar",
  "denis roldan": "Dennis Ítalo Roldan Rodriguez",
  "dennis roldan": "Dennis Ítalo Roldan Rodriguez",
  "dennis italo roldan rodriguez": "Dennis Ítalo Roldan Rodriguez",
  "italo roldan": "Dennis Ítalo Roldan Rodriguez",
  "elio otiniano": "Elio Otiniano Sánchez",
  "ercik cuba": "Erick Cuba Meneses",
  "erick cuba": "Erick Cuba Meneses",
  "enrique martin la rosa ubillas": "Enrique Martín La Rosa Ubillas",
  "gregorio ore": "Martín Gregorio Oré Guerrero",
  "martin ore guerrero": "Martín Gregorio Oré Guerrero",
  "hector mujica": "Hector Mujica Acurio",
  "hector torres": "Héctor Iván Torres Rivera",
  "helena murguia": "Helena Úrsula Murguia García",
  "humberto flores": "Humberto Flores Arévalo",
  "ivan casiano": "Ivan Alexander Casiano Lossio",
  "jaime cheng": "Jaime Cheng Amaya",
  "jashim valdivieso": "Jashim Valdivieso",
  "juan valdivieso": "Juan Valdivieso",
  "jose carrillo": "Jose Miguel Carrillo Cuestas",
  "jose trelles": "José Antonio Trelles Castillo",
  "trelles castillo": "José Antonio Trelles Castillo",
  "juan carlos medina flores": "Juan Carlos Medina Flores",
  "juan carlos pinto": "Juan Carlos Pinto Escobedo",
  "juan quintana": "Juan Alberto Quintana Sanchez",
  "juan quintana sanchez": "Juan Alberto Quintana Sanchez",
  "luis puglianini": "Luis Puglianini Guerra",
  "luis puglianini guerra": "Luis Puglianini Guerra",
  "marco martinez": "Marco Antonio Martinez Zamora",
  "marco morales": "Marko Alexis Morales Martínez",
  "marko morales": "Marko Alexis Morales Martínez",
  "marko alexis morales martinez": "Marko Alexis Morales Martínez",
  "mario linares": "Mario Ernesto Linares Jara",
  "mario ernesto linares jara": "Mario Ernesto Linares Jara",
  "magno ivan parédez neyra": "Magno Ivan Parédez Neyra",
  "natalia tincopa": "Natalia Patricia Tincopa Cebrian",
  "natalia tincopa cebrian": "Natalia Patricia Tincopa Cebrian",
  "natalia patricia tincopa cebrián": "Natalia Patricia Tincopa Cebrian",
  "patricia lora": "Patricia Mary Lora Rios",
  "patricia lora ríos": "Patricia Mary Lora Rios",
  "patricia mary lora rios": "Patricia Mary Lora Rios",
  "patrick hurtado": "Patrick Hurtado Tueros",
  "raul salazar": "Raul Salazar Rivera",
  "raúl leonid salazar rivera": "Raul Salazar Rivera",
  "rodrigo freitas": "Rodrigo Andrés Freitas Cabanillas",
  "richard james martin tirado": "Richard Martin Tirado",
  "richard martin": "Richard Martin Tirado",
  "salomé teresa reynoso romero": "Salomé Teresa Reynoso Romero",
  "vicente tincopa": "Vicente Fernando Tincopa Cebrian",
  "vicente tincipa": "Vicente Fernando Tincopa Cebrian",
  "vicente fernando tincopa torres": "Vicente Fernando Tincopa Cebrian",
};

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("=== Asignar árbitros a expedientes ===\n");

  const assignments: Record<string, string[]> = JSON.parse(
    fs.readFileSync("/tmp/arbitros_assignments.json", "utf-8")
  );

  const center = await p.center.findFirst({ where: { code: "CAARD" } });
  if (!center) throw new Error("No center");

  // Get all current arbitrators
  const arbitros = await p.user.findMany({
    where: { role: "ARBITRO" },
    include: { arbitratorRegistry: true },
  });
  console.log(`Árbitros actuales: ${arbitros.length}`);

  // Build lookup map
  const arbitroByName = new Map<string, (typeof arbitros)[0]>();
  for (const a of arbitros) {
    if (a.name) arbitroByName.set(normalize(a.name), a);
  }

  const passwordHash = await bcrypt.hash("Caard2025!", 12);

  // Track which arbitrators are used in cases (these stay ACTIVE)
  const usedArbitratorIds = new Set<string>();

  // Assign arbitrators to cases
  let assignedCount = 0;
  let createdNewArbitrators = 0;
  const notFound = new Set<string>();

  for (const [excelCode, arbNames] of Object.entries(assignments)) {
    // Find the case (codes in DB are like "Exp. 001-2024-ARB/CAARD")
    const dbCase = await p.case.findFirst({
      where: { code: { contains: excelCode } },
    });

    if (!dbCase) {
      console.log(`  Caso no encontrado: ${excelCode}`);
      continue;
    }

    for (const rawName of arbNames) {
      const key = normalizeKey(rawName);
      const canonicalName = NAME_NORMALIZER[key] || rawName;
      let arbitro = arbitroByName.get(normalize(canonicalName));

      if (!arbitro) {
        // Try direct match with original name
        arbitro = arbitroByName.get(normalize(rawName));
      }

      if (!arbitro) {
        // Create new arbitrator with INACTIVE status
        notFound.add(canonicalName);
        const slug = normalize(canonicalName).replace(/\s+/g, ".");
        const email = `${slug}@arbitro-historico.caard.pe`;

        try {
          const newUser = await p.user.create({
            data: {
              email,
              name: canonicalName,
              role: "ARBITRO",
              centerId: center.id,
              passwordHash,
              isActive: true,
            },
          });
          await p.arbitratorRegistry.create({
            data: {
              centerId: center.id,
              userId: newUser.id,
              status: "RETIRED", // Marked as retired since not in current official list
              specializations: ["Histórico"],
            },
          });
          arbitro = await p.user.findUnique({
            where: { id: newUser.id },
            include: { arbitratorRegistry: true },
          });
          if (arbitro) arbitroByName.set(normalize(canonicalName), arbitro);
          createdNewArbitrators++;
        } catch (e: any) {
          if (e.code === "P2002") {
            // Email already exists, find it
            arbitro = await p.user.findUnique({
              where: { email },
              include: { arbitratorRegistry: true },
            });
            if (arbitro) arbitroByName.set(normalize(canonicalName), arbitro);
          } else {
            console.error(`  Error creando ${canonicalName}: ${e.message}`);
            continue;
          }
        }
      }

      if (!arbitro) continue;
      usedArbitratorIds.add(arbitro.id);

      // Check if member already exists
      const existing = await p.caseMember.findFirst({
        where: { caseId: dbCase.id, userId: arbitro.id, role: "ARBITRO" },
      });
      if (!existing) {
        await p.caseMember.create({
          data: {
            caseId: dbCase.id,
            userId: arbitro.id,
            role: "ARBITRO",
            displayName: arbitro.name,
            email: arbitro.email,
            isPrimary: false,
          },
        });
        assignedCount++;
      }
    }
  }

  console.log(`\n✓ Asignaciones creadas: ${assignedCount}`);
  console.log(`✓ Árbitros nuevos (RETIRED): ${createdNewArbitrators}`);
  if (notFound.size > 0) {
    console.log(`\nÁrbitros no encontrados en lista oficial (marcados RETIRED):`);
    for (const n of notFound) console.log(`  - ${n}`);
  }

  // Final summary
  const total = await p.user.count({ where: { role: "ARBITRO" } });
  const active = await p.arbitratorRegistry.count({ where: { status: "ACTIVE" } });
  const retired = await p.arbitratorRegistry.count({ where: { status: "RETIRED" } });
  const totalMembers = await p.caseMember.count({ where: { role: "ARBITRO" } });

  console.log(`\n=== FINAL ===`);
  console.log(`Total árbitros: ${total}`);
  console.log(`  - ACTIVE: ${active}`);
  console.log(`  - RETIRED: ${retired}`);
  console.log(`Total miembros ARBITRO en casos: ${totalMembers}`);

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
