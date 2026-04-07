import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();

const OFFICIAL_LIST: Record<string, { name: string; specs: string[] }> = {
  'amaya ayala leoni raul': { name: 'Leoni Raúl Amaya Ayala', specs: ['Civil','Comercial'] },
  'aramburu rafael artieda': { name: 'Rafael Artieda Aramburú', specs: ['Civil','Comercial','Laboral','Contratación Pública'] },
  'artieda aramburu rafael': { name: 'Rafael Artieda Aramburú', specs: ['Civil','Comercial','Laboral','Contratación Pública'] },
  'balbi calmet jorge alberto': { name: 'Jorge Alberto Balbi Calmet', specs: ['Civil','Comercial'] },
  'balbi gatjens alfredo': { name: 'Alfredo Balbi Gatjens', specs: ['Civil','Comercial','Contratación Pública'] },
  'bedoya denegri alonso': { name: 'Alonso Bedoya Denegri', specs: ['Civil'] },
  'carrera dongo alvaro rodrigo': { name: 'Alvaro Rodrigo Carrera Dongo', specs: ['Contratación Pública'] },
  'alvaro rodrigo carrera dongo': { name: 'Alvaro Rodrigo Carrera Dongo', specs: ['Contratación Pública'] },
  'carrillo cuestas jose miguel': { name: 'Jose Miguel Carrillo Cuestas', specs: ['Civil','Contratación Pública'] },
  'cavero egusquiza zariquiey javier': { name: 'Javier Cavero Egusquiza Zariquiey', specs: ['Civil','Comercial','Contratación Pública'] },
  'javier cavero egusquiza zariquiey': { name: 'Javier Cavero Egusquiza Zariquiey', specs: ['Civil','Comercial','Contratación Pública'] },
  'cheng amaya jaime': { name: 'Jaime Cheng Amaya', specs: ['Civil','Comercial'] },
  'criado leon andres agusto': { name: 'Andrés Augusto Criado León', specs: ['Civil'] },
  'andres augusto criado leon': { name: 'Andrés Augusto Criado León', specs: ['Civil'] },
  'costa lopez nestor antonio': { name: 'Nestor Antonio Costa Lopez', specs: ['Civil','Comercial','Laboral','Contratación Pública'] },
  'nestor antonio costa lopez': { name: 'Nestor Antonio Costa Lopez', specs: ['Civil','Comercial','Laboral','Contratación Pública'] },
  'fernandez stoll camila': { name: 'Camila Fernández-Stoll', specs: ['Civil','Comercial'] },
  'camila ferandez stoll': { name: 'Camila Fernández-Stoll', specs: ['Civil','Comercial'] },
  'fonseca ramos ivan': { name: 'Ivan Fonseca Ramos', specs: ['Civil','Comercial','Contratación Pública'] },
  'ivan fonseca ramos': { name: 'Ivan Fonseca Ramos', specs: ['Civil','Comercial','Contratación Pública'] },
  'garcia locatelli javier': { name: 'Javier García Locatelli', specs: ['Civil','Comercial','Contratación Pública'] },
  'javier garcia locatelli': { name: 'Javier García Locatelli', specs: ['Civil','Comercial','Contratación Pública'] },
  'galvez miranda jose alberto': { name: 'José Alberto Gálvez Miranda', specs: ['Contratación Pública'] },
  'goicochea lecca vickhy': { name: 'Vickhy Goicochea Lecca', specs: ['Civil','Comercial','Contratación Pública'] },
  'vickhy goicochea lecca': { name: 'Vickhy Goicochea Lecca', specs: ['Civil','Comercial','Contratación Pública'] },
  'gomez aguilar edgar martin': { name: 'Edgar Martín Gómez Aguilar', specs: ['Civil','Comercial'] },
  'martin gomez aguilar': { name: 'Edgar Martín Gómez Aguilar', specs: ['Civil','Comercial'] },
  'gonzales pelaez alvaro': { name: 'Álvaro Gonzáles Peláez', specs: ['Civil','Contratación Pública'] },
  'alvaro gonzales pelaez': { name: 'Álvaro Gonzáles Peláez', specs: ['Civil','Contratación Pública'] },
  'hundskopf exebio oswaldo': { name: 'Oswaldo Hundskopf Exebio', specs: ['Civil','Comercial'] },
  'oswaldo hundskoff exebio': { name: 'Oswaldo Hundskopf Exebio', specs: ['Civil','Comercial'] },
  'hurtado tueros patrick': { name: 'Patrick Hurtado Tueros', specs: ['Civil'] },
  'patrick hurtado tueros': { name: 'Patrick Hurtado Tueros', specs: ['Civil'] },
  'lama more hector enrique': { name: 'Héctor Enrique Lama More', specs: ['Civil','Comercial'] },
  'hector enrique lama more': { name: 'Héctor Enrique Lama More', specs: ['Civil','Comercial'] },
  'linares jara mario ernesto': { name: 'Mario Ernesto Linares Jara', specs: ['Civil','Comercial','Contratación Pública'] },
  'mario ernesto linares jara': { name: 'Mario Ernesto Linares Jara', specs: ['Civil','Comercial','Contratación Pública'] },
  'linares vivanco mariano jose': { name: 'Mariano José Linares Vivanco', specs: ['Civil','Comercial'] },
  'mariano jose linares vivanco': { name: 'Mariano José Linares Vivanco', specs: ['Civil','Comercial'] },
  'malca saavedra daniel': { name: 'Daniel Malca Saavedra', specs: ['Civil','Comercial'] },
  'daniel malca saavedra': { name: 'Daniel Malca Saavedra', specs: ['Civil','Comercial'] },
  'marcionelli rodriguez luis felipe domingo': { name: 'Luis Felipe Domingo Marcionelli Rodriguez', specs: ['Civil','Comercial'] },
  'luis felipe domingo marcionelli rodriguez': { name: 'Luis Felipe Domingo Marcionelli Rodriguez', specs: ['Civil','Comercial'] },
  'martin tirado richard': { name: 'Richard Martin Tirado', specs: ['Contratación Pública'] },
  'richard martin tirado': { name: 'Richard Martin Tirado', specs: ['Contratación Pública'] },
  'martinez villacorta diego renato': { name: 'Diego Renato Martinez Villacorta', specs: ['Contratación Pública'] },
  'diego renato martinez villacorta': { name: 'Diego Renato Martinez Villacorta', specs: ['Contratación Pública'] },
  'martinez zamora marco antonio': { name: 'Marco Antonio Martinez Zamora', specs: ['Contratación Pública'] },
  'marco antonio martinez villacorta': { name: 'Marco Antonio Martinez Zamora', specs: ['Contratación Pública'] },
  'medina flores juan carlos': { name: 'Juan Carlos Medina Flores', specs: ['Contratación Pública'] },
  'juan carlos medina flores': { name: 'Juan Carlos Medina Flores', specs: ['Contratación Pública'] },
  'morales martinez marko alexis': { name: 'Marko Alexis Morales Martínez', specs: ['Contratación Pública'] },
  'marko alexis morales martinez': { name: 'Marko Alexis Morales Martínez', specs: ['Contratación Pública'] },
  'mujica acurio hector': { name: 'Hector Mujica Acurio', specs: ['Contratación Pública'] },
  'hector mujica acurio': { name: 'Hector Mujica Acurio', specs: ['Contratación Pública'] },
  'munoz wells jorge': { name: 'Jorge Muñoz Wells', specs: ['Civil','Comercial','Contratación Pública'] },
  'jorge munoz wells': { name: 'Jorge Muñoz Wells', specs: ['Civil','Comercial','Contratación Pública'] },
  'murguia garcia helena ursula': { name: 'Helena Úrsula Murguia García', specs: ['Contratación Pública'] },
  'helena ursula murguia garcia': { name: 'Helena Úrsula Murguia García', specs: ['Contratación Pública'] },
  'ore guerrero martin gregorio': { name: 'Martín Gregorio Oré Guerrero', specs: ['Civil','Laboral'] },
  'martin gregorio ore guerrero': { name: 'Martín Gregorio Oré Guerrero', specs: ['Civil','Laboral'] },
  'patron bedoya pedro': { name: 'Pedro Patrón Bedoya', specs: ['Civil','Comercial'] },
  'pedro patron bedoya': { name: 'Pedro Patrón Bedoya', specs: ['Civil','Comercial'] },
  'peramas ayala cesar eduardo': { name: 'César Eduardo Peramás Ayala', specs: ['Civil','Comercial','Contratación Pública'] },
  'cesar eduardo peramas ayala': { name: 'César Eduardo Peramás Ayala', specs: ['Civil','Comercial','Contratación Pública'] },
  'reynoso romero salome teresa': { name: 'Salomé Teresa Reynoso Romero', specs: ['Civil','Comercial'] },
  'salome teresa reynoso romero': { name: 'Salomé Teresa Reynoso Romero', specs: ['Civil','Comercial'] },
  'quintana sanchez juan alberto': { name: 'Juan Alberto Quintana Sanchez', specs: ['Civil','Comercial'] },
  'juan alberto quintana sanchez': { name: 'Juan Alberto Quintana Sanchez', specs: ['Civil','Comercial'] },
  'retamozo linares alberto': { name: 'Alberto Retamozo Linares', specs: ['Civil'] },
  'alberto retamozo linares': { name: 'Alberto Retamozo Linares', specs: ['Civil'] },
  'rodriguez talavera jaime': { name: 'Jaime Rodriguez Talavera', specs: ['Civil','Comercial','Contratación Pública'] },
  'jaime rodriguez talavera': { name: 'Jaime Rodriguez Talavera', specs: ['Civil','Comercial','Contratación Pública'] },
  'rojas delgado magali': { name: 'Magali Rojas Delgado', specs: ['Contratación Pública'] },
  'magali rojas delgado': { name: 'Magali Rojas Delgado', specs: ['Contratación Pública'] },
  'salazar rivera raul': { name: 'Raul Salazar Rivera', specs: ['Civil'] },
  'raul salazar rivera': { name: 'Raul Salazar Rivera', specs: ['Civil'] },
  'salazar chavez homero absalon': { name: 'Homero Absalon Salazar Chavez', specs: ['Civil','Comercial'] },
  'homero absalon salazar chavez': { name: 'Homero Absalon Salazar Chavez', specs: ['Civil','Comercial'] },
  'tincopa cebrian natalia': { name: 'Natalia Patricia Tincopa Cebrian', specs: ['Civil','Comercial'] },
  'natalia patricia tincopa cebrian': { name: 'Natalia Patricia Tincopa Cebrian', specs: ['Civil','Comercial'] },
  'tincopa torres vicente fernando': { name: 'Vicente Fernando Tincopa Cebrian', specs: ['Civil','Comercial'] },
  'vicente fernando tincopa cebrian': { name: 'Vicente Fernando Tincopa Cebrian', specs: ['Civil','Comercial'] },
  'trelles castillo jose antonio': { name: 'José Antonio Trelles Castillo', specs: ['Civil'] },
  'jose antonio trelles castillo': { name: 'José Antonio Trelles Castillo', specs: ['Civil'] },
  'varsi rospigliosi enrique': { name: 'Enrique Varsi Rospigliosi', specs: ['Civil','Comercial'] },
  'enrique varsi rospigliosi': { name: 'Enrique Varsi Rospigliosi', specs: ['Civil','Comercial'] },
  'vilches mendoza jennifer': { name: 'Jennifer Vilchez Mendoza', specs: ['Civil','Comercial','Laboral'] },
  'jennifer vilchez mendoza': { name: 'Jennifer Vilchez Mendoza', specs: ['Civil','Comercial','Laboral'] },
  'zavala cadenillas ursula carmen': { name: 'Ursula Carmen Zavala Cadenillas', specs: ['Civil','Comercial'] },
  'ursula carmen zavala cadenillas': { name: 'Ursula Carmen Zavala Cadenillas', specs: ['Civil','Comercial'] },
  'ulffe carrera jessica': { name: 'Jessica Ulffe Carrera', specs: ['Contratación Pública'] },
  'jessica ulffe carrera': { name: 'Jessica Ulffe Carrera', specs: ['Contratación Pública'] },
  'zapata rios carlos orlando': { name: 'Carlos Orlando Zapata Rios', specs: ['Contratación Pública'] },
  'carlos orlando zapata rios': { name: 'Carlos Orlando Zapata Rios', specs: ['Contratación Pública'] },
  'zuniga moran edgar raul': { name: 'Edgar Raúl Zúñiga Morán', specs: ['Contratación Pública'] },
  'diaz sanchez leslie': { name: 'Leslie Diaz Sanchez', specs: ['Contratación Pública'] },
  'leslie diaz sanchez': { name: 'Leslie Diaz Sanchez', specs: ['Contratación Pública'] },
};

function normalize(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

async function main() {
  const center = await p.center.findFirst({ where: { code: 'CAARD' } });
  if (!center) throw new Error('No center');
  
  // Get unique official names (deduplicated)
  const officialUnique = new Map<string, { name: string; specs: string[] }>();
  for (const [, data] of Object.entries(OFFICIAL_LIST)) {
    officialUnique.set(data.name, data);
  }
  console.log('Unique official arbitrators:', officialUnique.size);
  
  // Get current arbitrators
  const current = await p.user.findMany({
    where: { role: 'ARBITRO' },
    include: { arbitratorRegistry: true }
  });
  console.log('Current DB arbitrators:', current.length);
  
  const matchedUserIds = new Set<string>();
  const matchedOfficialNames = new Set<string>();
  
  // Match current users to official list
  for (const user of current) {
    const norm = normalize(user.name || '');
    const match = OFFICIAL_LIST[norm];
    if (match) {
      matchedUserIds.add(user.id);
      matchedOfficialNames.add(match.name);
      
      // Update user with correct name and registry
      await p.user.update({
        where: { id: user.id },
        data: { name: match.name }
      });
      
      // Update or create registry
      if (user.arbitratorRegistry) {
        await p.arbitratorRegistry.update({
          where: { id: user.arbitratorRegistry.id },
          data: { 
            specializations: match.specs,
            status: 'ACTIVE',
          }
        });
      } else {
        await p.arbitratorRegistry.create({
          data: {
            centerId: center.id,
            userId: user.id,
            status: 'ACTIVE',
            specializations: match.specs,
          }
        });
      }
    }
  }
  
  console.log('\\nMatched and updated:', matchedUserIds.size);
  
  // Delete users not in official list
  const toDeleteUsers = current.filter(u => !matchedUserIds.has(u.id));
  console.log('\\nDeleting', toDeleteUsers.length, 'arbitrators not in official list...');
  
  for (const user of toDeleteUsers) {
    console.log('  Deleting:', user.name);
    // Delete dependent records first
    await p.arbitratorProfile.deleteMany({ where: { registry: { userId: user.id } } });
    await p.arbitratorRegistry.deleteMany({ where: { userId: user.id } });
    
    // Check if user has any case memberships
    const memberCount = await p.caseMember.count({ where: { userId: user.id } });
    if (memberCount > 0) {
      // Just unset userId in members, keep the case data
      await p.caseMember.updateMany({ where: { userId: user.id }, data: { userId: null } });
    }
    
    // Delete the user
    await p.user.delete({ where: { id: user.id } });
  }
  
  // Create missing arbitrators
  const missing: Array<{name: string; specs: string[]}> = [];
  for (const [name, data] of officialUnique.entries()) {
    if (!matchedOfficialNames.has(name)) {
      missing.push(data);
    }
  }
  
  console.log('\\nCreating', missing.length, 'new arbitrators:');
  const passwordHash = await bcrypt.hash('Caard2025!', 12);
  
  for (const m of missing) {
    console.log('  Creating:', m.name);
    const slug = slugify(m.name);
    const email = slug.replace(/-/g, '.') + '@arbitro.caard.pe';
    
    const user = await p.user.create({
      data: {
        email,
        name: m.name,
        role: 'ARBITRO',
        centerId: center.id,
        passwordHash,
        isActive: true,
      }
    });
    
    await p.arbitratorRegistry.create({
      data: {
        centerId: center.id,
        userId: user.id,
        status: 'ACTIVE',
        specializations: m.specs,
      }
    });
  }
  
  // Update profiles for all current arbitrators
  console.log('\\nUpdating arbitrator profiles...');
  const allRegistries = await p.arbitratorRegistry.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { name: true, email: true } } }
  });
  
  for (const reg of allRegistries) {
    const name = reg.user.name || 'Árbitro';
    const slug = slugify(name);
    const specs = reg.specializations as string[];
    const title = specs.length > 0 ? 'Árbitro especialista en ' + specs.join(', ') : 'Árbitro';
    
    let finalSlug = slug;
    let counter = 1;
    let existing = await p.arbitratorProfile.findUnique({ where: { slug: finalSlug } });
    while (existing && existing.registryId !== reg.id) {
      finalSlug = slug + '-' + counter++;
      existing = await p.arbitratorProfile.findUnique({ where: { slug: finalSlug } });
    }
    
    await p.arbitratorProfile.upsert({
      where: { registryId: reg.id },
      update: { displayName: name, title, contactEmail: reg.user.email, isPublished: true },
      create: {
        registryId: reg.id,
        slug: finalSlug,
        displayName: name,
        title,
        contactEmail: reg.user.email,
        languages: ['Español'],
        isPublished: true,
      }
    });
  }
  
  // Final summary
  const finalCount = await p.user.count({ where: { role: 'ARBITRO' } });
  const finalRegistry = await p.arbitratorRegistry.count({ where: { status: 'ACTIVE' } });
  const finalProfiles = await p.arbitratorProfile.count({ where: { isPublished: true } });
  
  console.log('\\n=== FINAL ===');
  console.log('Arbitrator users:', finalCount);
  console.log('Active registries:', finalRegistry);
  console.log('Published profiles:', finalProfiles);
  
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
