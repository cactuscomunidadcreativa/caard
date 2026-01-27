/**
 * CAARD - Servicio de Cálculo de Días Hábiles
 * ============================================
 * Maneja el cálculo de plazos procesales según días hábiles peruanos.
 *
 * Días hábiles: Lunes a Viernes
 * Excluye: Feriados nacionales de Perú
 */

import { BUSINESS_DAYS, DEFAULT_TIMEZONE } from "./constants";

// =============================================================================
// FERIADOS DE PERÚ
// =============================================================================

/**
 * Feriados fijos de Perú (mes-día)
 * Estos se repiten cada año
 */
const FIXED_HOLIDAYS: string[] = [
  "01-01", // Año Nuevo
  "05-01", // Día del Trabajo
  "06-29", // San Pedro y San Pablo
  "07-28", // Fiestas Patrias
  "07-29", // Fiestas Patrias
  "08-06", // Batalla de Junín (desde 2022)
  "08-30", // Santa Rosa de Lima
  "10-08", // Combate de Angamos
  "11-01", // Día de Todos los Santos
  "12-08", // Inmaculada Concepción
  "12-09", // Batalla de Ayacucho (desde 2022)
  "12-25", // Navidad
];

/**
 * Feriados móviles y específicos por año
 * Semana Santa varía cada año
 */
const VARIABLE_HOLIDAYS: Record<number, string[]> = {
  2024: [
    "03-28", // Jueves Santo
    "03-29", // Viernes Santo
  ],
  2025: [
    "04-17", // Jueves Santo
    "04-18", // Viernes Santo
  ],
  2026: [
    "04-02", // Jueves Santo
    "04-03", // Viernes Santo
  ],
  2027: [
    "03-25", // Jueves Santo
    "03-26", // Viernes Santo
  ],
  2028: [
    "04-13", // Jueves Santo
    "04-14", // Viernes Santo
  ],
  2029: [
    "03-29", // Jueves Santo
    "03-30", // Viernes Santo
  ],
  2030: [
    "04-18", // Jueves Santo
    "04-19", // Viernes Santo
  ],
};

/**
 * Cache de feriados por año para mejor rendimiento
 */
const holidayCache: Map<number, Set<string>> = new Map();

// =============================================================================
// FUNCIONES PRINCIPALES
// =============================================================================

/**
 * Obtiene todos los feriados de un año
 */
export function getHolidaysForYear(year: number): Set<string> {
  // Verificar cache
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  const holidays = new Set<string>();

  // Agregar feriados fijos
  for (const holiday of FIXED_HOLIDAYS) {
    holidays.add(`${year}-${holiday}`);
  }

  // Agregar feriados variables del año
  const variableHolidays = VARIABLE_HOLIDAYS[year] || [];
  for (const holiday of variableHolidays) {
    holidays.add(`${year}-${holiday}`);
  }

  // Guardar en cache
  holidayCache.set(year, holidays);

  return holidays;
}

/**
 * Verifica si una fecha es feriado
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  const holidays = getHolidaysForYear(year);
  return holidays.has(dateKey);
}

/**
 * Verifica si una fecha es día de semana hábil (lunes-viernes)
 */
export function isWeekday(date: Date): boolean {
  return BUSINESS_DAYS.includes(date.getDay());
}

/**
 * Verifica si una fecha es día hábil (día de semana y no feriado)
 */
export function isBusinessDay(date: Date): boolean {
  return isWeekday(date) && !isHoliday(date);
}

/**
 * Obtiene el siguiente día hábil desde una fecha
 * Si la fecha es día hábil, la retorna
 */
export function getNextBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * Obtiene el día hábil anterior desde una fecha
 * Si la fecha es día hábil, la retorna
 */
export function getPreviousBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

/**
 * Agrega N días hábiles a una fecha
 *
 * @param startDate - Fecha de inicio
 * @param businessDays - Número de días hábiles a agregar
 * @param startFromNextDay - Si es true, empieza a contar desde el día siguiente
 * @returns Nueva fecha después de agregar los días hábiles
 */
export function addBusinessDays(
  startDate: Date,
  businessDays: number,
  startFromNextDay: boolean = true
): Date {
  if (businessDays < 0) {
    throw new Error("El número de días hábiles debe ser positivo. Use subtractBusinessDays para restar.");
  }

  if (businessDays === 0) {
    return new Date(startDate);
  }

  let result = new Date(startDate);

  // Si debe empezar desde el siguiente día
  if (startFromNextDay) {
    result.setDate(result.getDate() + 1);
  }

  let daysAdded = 0;

  while (daysAdded < businessDays) {
    // Si es día hábil, contar
    if (isBusinessDay(result)) {
      daysAdded++;
    }

    // Si no hemos llegado al total, avanzar al siguiente día
    if (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
    }
  }

  // Asegurarse de que el resultado sea un día hábil
  result = getNextBusinessDay(result);

  return result;
}

/**
 * Resta N días hábiles a una fecha
 */
export function subtractBusinessDays(
  startDate: Date,
  businessDays: number
): Date {
  if (businessDays < 0) {
    throw new Error("El número de días hábiles debe ser positivo");
  }

  if (businessDays === 0) {
    return new Date(startDate);
  }

  const result = new Date(startDate);
  let daysSubtracted = 0;

  while (daysSubtracted < businessDays) {
    result.setDate(result.getDate() - 1);

    if (isBusinessDay(result)) {
      daysSubtracted++;
    }
  }

  return result;
}

/**
 * Calcula el número de días hábiles entre dos fechas
 *
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @param inclusive - Si incluir ambas fechas en el conteo
 * @returns Número de días hábiles
 */
export function countBusinessDays(
  startDate: Date,
  endDate: Date,
  inclusive: boolean = false
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return -countBusinessDays(endDate, startDate, inclusive);
  }

  let count = 0;
  const current = new Date(start);

  // Si no es inclusive, empezar desde el día siguiente
  if (!inclusive) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Calcula la fecha de vencimiento de un plazo procesal
 *
 * @param startDate - Fecha de inicio del plazo
 * @param businessDays - Días hábiles del plazo
 * @param timezone - Zona horaria (default: America/Lima)
 * @returns Objeto con fecha de vencimiento y información adicional
 */
export function calculateDeadline(
  startDate: Date,
  businessDays: number,
  timezone: string = DEFAULT_TIMEZONE
): {
  dueDate: Date;
  startDate: Date;
  businessDays: number;
  calendarDays: number;
  holidaysInRange: Date[];
  weekendsInRange: number;
} {
  const start = new Date(startDate);
  const dueDate = addBusinessDays(start, businessDays, true);

  // Contar feriados y fines de semana en el rango
  const holidaysInRange: Date[] = [];
  let weekendsInRange = 0;
  const current = new Date(start);
  current.setDate(current.getDate() + 1);

  while (current <= dueDate) {
    if (!isWeekday(current)) {
      weekendsInRange++;
    } else if (isHoliday(current)) {
      holidaysInRange.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  // Calcular días calendario
  const calendarDays = Math.ceil(
    (dueDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    dueDate,
    startDate: start,
    businessDays,
    calendarDays,
    holidaysInRange,
    weekendsInRange,
  };
}

/**
 * Verifica si un plazo está vencido
 *
 * @param dueDate - Fecha de vencimiento
 * @param currentDate - Fecha actual (opcional, default: now)
 * @returns true si el plazo está vencido
 */
export function isDeadlineOverdue(
  dueDate: Date,
  currentDate: Date = new Date()
): boolean {
  // El plazo vence al final del día hábil
  const dueDateEnd = new Date(dueDate);
  dueDateEnd.setHours(23, 59, 59, 999);

  return currentDate > dueDateEnd;
}

/**
 * Calcula cuántos días hábiles faltan para un vencimiento
 *
 * @param dueDate - Fecha de vencimiento
 * @param currentDate - Fecha actual (opcional, default: now)
 * @returns Días hábiles restantes (negativo si está vencido)
 */
export function daysUntilDeadline(
  dueDate: Date,
  currentDate: Date = new Date()
): number {
  if (currentDate > dueDate) {
    // Ya está vencido, retornar negativo
    return -countBusinessDays(dueDate, currentDate, false);
  }

  return countBusinessDays(currentDate, dueDate, false);
}

/**
 * Obtiene la hora límite para un plazo (fin del día hábil)
 * En Perú típicamente 18:00 o 23:59 dependiendo del contexto
 */
export function getDeadlineEndTime(
  dueDate: Date,
  endHour: number = 23,
  endMinute: number = 59
): Date {
  const result = new Date(dueDate);
  result.setHours(endHour, endMinute, 59, 999);
  return result;
}

// =============================================================================
// UTILIDADES PARA INTERFACE
// =============================================================================

/**
 * Formatea información de un plazo para mostrar en la UI
 */
export function formatDeadlineInfo(
  startDate: Date,
  businessDays: number
): {
  dueDate: Date;
  dueDateFormatted: string;
  daysRemaining: number;
  status: "SAFE" | "WARNING" | "URGENT" | "OVERDUE";
  statusLabel: string;
} {
  const deadline = calculateDeadline(startDate, businessDays);
  const daysRemaining = daysUntilDeadline(deadline.dueDate);

  const dueDateFormatted = deadline.dueDate.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let status: "SAFE" | "WARNING" | "URGENT" | "OVERDUE";
  let statusLabel: string;

  if (daysRemaining < 0) {
    status = "OVERDUE";
    statusLabel = `Vencido hace ${Math.abs(daysRemaining)} día${Math.abs(daysRemaining) !== 1 ? "s" : ""} hábil${Math.abs(daysRemaining) !== 1 ? "es" : ""}`;
  } else if (daysRemaining === 0) {
    status = "URGENT";
    statusLabel = "Vence hoy";
  } else if (daysRemaining <= 2) {
    status = "URGENT";
    statusLabel = `Vence en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""} hábil${daysRemaining !== 1 ? "es" : ""}`;
  } else if (daysRemaining <= 5) {
    status = "WARNING";
    statusLabel = `${daysRemaining} días hábiles restantes`;
  } else {
    status = "SAFE";
    statusLabel = `${daysRemaining} días hábiles restantes`;
  }

  return {
    dueDate: deadline.dueDate,
    dueDateFormatted,
    daysRemaining,
    status,
    statusLabel,
  };
}

/**
 * Genera el calendario de un plazo mostrando todos los días
 */
export function generateDeadlineCalendar(
  startDate: Date,
  businessDays: number
): Array<{
  date: Date;
  dateFormatted: string;
  dayOfWeek: string;
  isBusinessDay: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  isStartDate: boolean;
  isDueDate: boolean;
  businessDayNumber: number | null;
}> {
  const deadline = calculateDeadline(startDate, businessDays);
  const calendar = [];

  const current = new Date(startDate);
  let businessDayCount = 0;

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  while (current <= deadline.dueDate) {
    const isBizDay = isBusinessDay(current);
    const isStartDay = current.toDateString() === startDate.toDateString();
    const isDue = current.toDateString() === deadline.dueDate.toDateString();

    if (isBizDay && !isStartDay) {
      businessDayCount++;
    }

    calendar.push({
      date: new Date(current),
      dateFormatted: current.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      }),
      dayOfWeek: dayNames[current.getDay()],
      isBusinessDay: isBizDay,
      isHoliday: isHoliday(current),
      isWeekend: !isWeekday(current),
      isStartDate: isStartDay,
      isDueDate: isDue,
      businessDayNumber: isBizDay && !isStartDay ? businessDayCount : null,
    });

    current.setDate(current.getDate() + 1);
  }

  return calendar;
}
