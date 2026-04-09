/**
 * CAARD - Plazos procesales según reglamentos oficiales
 *
 * Fuentes:
 *   - Reglamento Interno CAARD (2022)
 *   - Reglamento del Árbitro de Emergencia CAARD (2023)
 *   - Reglamento de Arbitraje CAARD (estándar institucional)
 *
 * Todos los plazos en DÍAS HÁBILES (excluye sábados, domingos y feriados).
 */

export interface PlazoReglamentario {
  type: string;
  title: string;
  businessDays: number;
  description: string;
  source: string; // artículo del reglamento
  category: "REGULAR" | "EMERGENCY" | "RECUSATION" | "PAYMENT" | "GENERAL";
  onOverdueAction?: "SUSPEND" | "ARCHIVE" | "NOTIFY" | "ESCALATE" | "AUTO_REJECT" | "EXPIRE_EMERGENCY";
}

/**
 * Plazos del proceso REGULAR de arbitraje
 * Basados en Reglamento de Arbitraje CAARD + DL 1071
 */
export const PLAZOS_REGULARES: PlazoReglamentario[] = [
  {
    type: "PAYMENT",
    title: "Pago de tasa de presentación",
    businessDays: 5,
    description: "El solicitante debe pagar la tasa de presentación para que se admita la solicitud.",
    source: "Reglamento de Aranceles, Art. general",
    category: "PAYMENT",
    onOverdueAction: "SUSPEND",
  },
  {
    type: "SUBSANACION",
    title: "Subsanación de solicitud de arbitraje",
    businessDays: 5,
    description: "Si la solicitud tiene observaciones, el solicitante debe subsanarlas.",
    source: "Reglamento de Arbitraje",
    category: "REGULAR",
    onOverdueAction: "ARCHIVE",
  },
  {
    type: "CONTESTACION",
    title: "Contestación de la solicitud de arbitraje",
    businessDays: 20,
    description: "La parte demandada tiene 20 días hábiles para contestar la solicitud de arbitraje desde la notificación.",
    source: "Reglamento de Arbitraje",
    category: "REGULAR",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "RECONVENCION",
    title: "Reconvención",
    businessDays: 20,
    description: "La parte demandada puede presentar reconvención junto con su contestación.",
    source: "Reglamento de Arbitraje",
    category: "REGULAR",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "CONTESTACION_RECONVENCION",
    title: "Contestación de la reconvención",
    businessDays: 15,
    description: "El demandante tiene 15 días hábiles para contestar la reconvención.",
    source: "Reglamento de Arbitraje",
    category: "REGULAR",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "DESIGNACION_ARBITRO",
    title: "Designación de árbitro por las partes",
    businessDays: 10,
    description: "Las partes deben designar su árbitro dentro de los 10 días hábiles siguientes a la notificación.",
    source: "Reglamento de Arbitraje / Reglamento Interno Art. 6a",
    category: "REGULAR",
    onOverdueAction: "ESCALATE",
  },
  {
    type: "CUSTOM",
    title: "Aceptación de árbitro designado",
    businessDays: 5,
    description: "El árbitro designado tiene 5 días hábiles para aceptar el cargo.",
    source: "Reglamento de Arbitraje",
    category: "REGULAR",
    onOverdueAction: "ESCALATE",
  },
  {
    type: "ALEGATOS",
    title: "Alegatos / Informes finales",
    businessDays: 15,
    description: "Plazo para presentar alegatos escritos o informes orales finales.",
    source: "Reglamento de Arbitraje",
    category: "REGULAR",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "CUSTOM",
    title: "Emisión del laudo",
    businessDays: 30,
    description: "El tribunal arbitral emitirá el laudo dentro de los 30 días hábiles siguientes al cierre de la instrucción.",
    source: "Reglamento de Arbitraje / DL 1071 Art. 53",
    category: "REGULAR",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "CUSTOM",
    title: "Solicitud de corrección/interpretación del laudo",
    businessDays: 15,
    description: "Las partes pueden solicitar corrección o interpretación del laudo dentro de 15 días hábiles desde la notificación.",
    source: "DL 1071 Art. 58",
    category: "REGULAR",
  },
];

/**
 * Plazos del proceso de EMERGENCIA
 * Fuente: Reglamento del Árbitro de Emergencia CAARD (2023)
 */
export const PLAZOS_EMERGENCIA: PlazoReglamentario[] = [
  {
    type: "EMERGENCY_VERIFICATION",
    title: "Verificación de solicitud de emergencia",
    businessDays: 1,
    description: "El Centro verificará los requisitos de la solicitud en máximo 1 día hábil.",
    source: "Reglamento Emergencia, Art. 3",
    category: "EMERGENCY",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "EMERGENCY_PAYMENT",
    title: "Pago de tasa de emergencia",
    businessDays: 1,
    description: "El solicitante debe pagar la tasa administrativa (S/. 1,800 + IGV nacional, $1,500 internacional).",
    source: "Reglamento Emergencia, Art. 3 y 12",
    category: "EMERGENCY",
    onOverdueAction: "ARCHIVE",
  },
  {
    type: "EMERGENCY_DESIGNATION",
    title: "Designación y aceptación del árbitro de emergencia",
    businessDays: 3,
    description: "Entre la presentación y la aceptación del árbitro de emergencia transcurrirán como máximo 3 días hábiles.",
    source: "Reglamento Emergencia, Art. 4",
    category: "EMERGENCY",
    onOverdueAction: "ESCALATE",
  },
  {
    type: "CUSTOM",
    title: "Traslado a contraparte (emergencia)",
    businessDays: 2,
    description: "Si el árbitro decide dar traslado a la contraparte, ésta tiene hasta 2 días hábiles para pronunciarse.",
    source: "Reglamento Emergencia, Art. 4",
    category: "EMERGENCY",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "EMERGENCY_RESOLUTION",
    title: "Resolución del árbitro de emergencia",
    businessDays: 2,
    description: "El árbitro de emergencia deberá resolver la medida cautelar en un plazo máximo de 2 días hábiles.",
    source: "Reglamento Emergencia, Art. 4",
    category: "EMERGENCY",
    onOverdueAction: "NOTIFY",
  },
  {
    type: "CUSTOM",
    title: "Notificación de orden procesal (emergencia)",
    businessDays: 1,
    description: "La Secretaría notificará la orden procesal a las partes dentro de 1 día hábil de expedida.",
    source: "Reglamento Emergencia, Art. 10",
    category: "EMERGENCY",
  },
  {
    type: "EMERGENCY_PRINCIPAL_REQUEST",
    title: "Presentación de solicitud de arbitraje principal",
    businessDays: 15,
    description: "El solicitante debe presentar la Solicitud de Arbitraje principal dentro de 15 días hábiles desde emitida la orden procesal, o la medida caduca.",
    source: "Reglamento Emergencia, Art. 5",
    category: "EMERGENCY",
    onOverdueAction: "EXPIRE_EMERGENCY",
  },
];

/**
 * Plazos de RECUSACIÓN
 * Fuentes: Reglamento Interno Art. 24 + Reglamento Emergencia Art. 7
 */
export const PLAZOS_RECUSACION: PlazoReglamentario[] = [
  {
    type: "RECUSACION_ABSOLUCION",
    title: "Absolución de recusación (regular)",
    businessDays: 5,
    description: "Se da traslado de la queja al árbitro por 5 días hábiles para que absuelva.",
    source: "Reglamento Interno, Art. 24",
    category: "RECUSATION",
    onOverdueAction: "ESCALATE",
  },
  {
    type: "RECUSACION_ABSOLUCION",
    title: "Absolución de recusación (emergencia)",
    businessDays: 1,
    description: "En emergencia, el árbitro recusado y la contraparte tienen 1 día hábil para absolver la recusación.",
    source: "Reglamento Emergencia, Art. 7",
    category: "RECUSATION",
    onOverdueAction: "ESCALATE",
  },
];

/** Todos los plazos agrupados */
export const ALL_PLAZOS = [
  ...PLAZOS_REGULARES,
  ...PLAZOS_EMERGENCIA,
  ...PLAZOS_RECUSACION,
];

/** Obtiene los plazos según el tipo de procedimiento */
export function getPlazosByProcedure(procedureType: "REGULAR" | "EMERGENCY" | "ALL" = "ALL") {
  if (procedureType === "ALL") return ALL_PLAZOS;
  if (procedureType === "EMERGENCY") return [...PLAZOS_EMERGENCIA, ...PLAZOS_RECUSACION.filter(p => p.description.includes("emergencia"))];
  return [...PLAZOS_REGULARES, ...PLAZOS_RECUSACION.filter(p => !p.description.includes("emergencia"))];
}
