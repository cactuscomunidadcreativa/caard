/**
 * CAARD - Esquema de validación para Solicitud Arbitral Pública
 */

import { z } from "zod";

// Esquema para persona (demandante/demandado)
export const personSchema = z.object({
  tipo: z.enum(["PERSONA_NATURAL", "PERSONA_JURIDICA"]),

  // Persona Natural
  nombres: z.string().optional(),
  apellidoPaterno: z.string().optional(),
  apellidoMaterno: z.string().optional(),

  // Persona Jurídica
  razonSocial: z.string().optional(),
  representanteLegal: z.string().optional(),
  cargoRepresentante: z.string().optional(),

  // Documento de identidad
  tipoDocumento: z.enum(["DNI", "CE", "RUC", "PASAPORTE"]),
  numeroDocumento: z.string().min(8, "Documento debe tener al menos 8 caracteres").max(20),

  // Contacto
  email: z.string().email("Email inválido"),
  telefono: z.string().min(9, "Teléfono inválido"),
  celular: z.string().optional(),

  // Dirección
  direccion: z.string().min(10, "Dirección muy corta"),
  distrito: z.string().optional(),
  provincia: z.string().optional(),
  departamento: z.string().optional(),
}).refine((data) => {
  if (data.tipo === "PERSONA_NATURAL") {
    return data.nombres && data.apellidoPaterno;
  }
  return data.razonSocial && data.representanteLegal;
}, {
  message: "Complete los datos según el tipo de persona",
});

export type PersonInput = z.infer<typeof personSchema>;

// Esquema principal de solicitud arbitral
export const publicRequestSchema = z.object({
  // Tipo de arbitraje
  tipoArbitraje: z.string().min(1, "Seleccione un tipo de arbitraje"),

  // Demandante
  demandante: personSchema,

  // Demandado
  demandado: personSchema,

  // Información de la controversia
  materia: z.string().min(1, "Seleccione la materia"),
  descripcionControversia: z.string()
    .min(50, "La descripción debe tener al menos 50 caracteres")
    .max(5000, "La descripción no puede exceder 5000 caracteres"),

  // Cuantía
  cuantiaDefinida: z.boolean(),
  montoCuantia: z.number().positive("El monto debe ser positivo").optional(),
  moneda: z.enum(["PEN", "USD"]),

  // Pretensiones
  pretensiones: z.string()
    .min(20, "Describa sus pretensiones (mínimo 20 caracteres)")
    .max(3000),

  // Contrato o relación jurídica
  existeContrato: z.boolean(),
  descripcionContrato: z.string().optional(),
  fechaContrato: z.string().optional(),

  // Cláusula arbitral
  existeClausulaArbitral: z.boolean(),
  textoClausulaArbitral: z.string().optional(),

  // Medios probatorios (descripción, los archivos se suben aparte)
  mediosProbatorios: z.string().optional(),

  // Aceptaciones legales
  aceptaTerminos: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones",
  }),
  aceptaPoliticaPrivacidad: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar la política de privacidad",
  }),
  declaraVeracidad: z.boolean().refine((val) => val === true, {
    message: "Debe declarar la veracidad de la información",
  }),
});

export type PublicRequestInput = z.infer<typeof publicRequestSchema>;

// Materias disponibles
export const MATERIAS_ARBITRAJE = [
  { value: "CONTRACTUAL", label: "Controversias contractuales" },
  { value: "LABORAL", label: "Controversias laborales" },
  { value: "INMOBILIARIO", label: "Controversias inmobiliarias" },
  { value: "SOCIETARIO", label: "Controversias societarias" },
  { value: "CONSTRUCCION", label: "Controversias de construcción" },
  { value: "CONSUMO", label: "Controversias de consumo" },
  { value: "COMERCIAL", label: "Controversias comerciales" },
  { value: "OTRO", label: "Otra materia" },
];
