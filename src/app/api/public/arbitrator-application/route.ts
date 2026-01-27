/**
 * CAARD - API de Aplicación para Árbitros
 * Recibe solicitudes de profesionales interesados en ser árbitros
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación
const applicationSchema = z.object({
  // Información personal
  fullName: z.string().min(3, "Nombre completo requerido"),
  documentType: z.enum(["DNI", "CE", "PASSPORT"]),
  documentNumber: z.string().min(6, "Número de documento requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(9, "Teléfono requerido"),
  address: z.string().optional(),

  // Información profesional
  profession: z.string().min(2, "Profesión requerida"),
  barNumber: z.string().optional(),
  barAssociation: z.string().optional(),
  yearsOfExperience: z.number().min(0),

  // Formación académica
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        year: z.number().optional(),
      })
    )
    .optional(),

  // Especialidades
  specializations: z.array(z.string()).min(1, "Seleccione al menos una especialidad"),

  // Experiencia en arbitraje
  arbitrationExperience: z.string().optional(),
  previousCases: z.number().optional(),

  // Idiomas
  languages: z.array(z.string()).optional(),

  // Motivación
  motivation: z.string().min(50, "Describa su motivación (mínimo 50 caracteres)"),

  // Declaraciones
  hasNoCriminalRecord: z.boolean().refine((val) => val === true, {
    message: "Debe declarar que no tiene antecedentes penales",
  }),
  acceptsEthicsCode: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar el código de ética",
  }),
  acceptsTerms: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones",
  }),

  // Documentos (URLs o referencias)
  cvUrl: z.string().optional(),
  degreeUrl: z.string().optional(),
  photoUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validationResult = applicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Obtener el centro principal
    const center = await prisma.center.findFirst({
      where: {},
    });

    if (!center) {
      return NextResponse.json(
        { error: "Centro no configurado" },
        { status: 500 }
      );
    }

    // Verificar si ya existe una aplicación con este email
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    // Si ya existe un usuario con registro de árbitro
    if (existingUser) {
      const existingArbitrator = await prisma.arbitratorRegistry.findUnique({
        where: { userId: existingUser.id },
      });

      if (existingArbitrator) {
        return NextResponse.json(
          {
            error: "Ya existe una solicitud o registro con este email o documento",
            status: existingArbitrator.status,
          },
          { status: 409 }
        );
      }
    }

    // Crear o actualizar usuario
    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: data.fullName,
        phoneE164: data.phone,
        role: "ARBITRO",
        centerId: center.id,
        // No tiene contraseña aún - se le enviará invitación
        isActive: false,
      },
      update: {
        name: data.fullName,
        phoneE164: data.phone,
      },
    });

    // Crear registro de árbitro en estado pendiente
    const arbitratorRegistry = await prisma.arbitratorRegistry.create({
      data: {
        centerId: center.id,
        userId: user.id,
        status: "PENDING_APPROVAL",
        barNumber: data.barNumber,
        barAssociation: data.barAssociation,
        specializations: data.specializations,
        applicationDate: new Date(),
        notes: JSON.stringify({
          profession: data.profession,
          yearsOfExperience: data.yearsOfExperience,
          education: data.education,
          arbitrationExperience: data.arbitrationExperience,
          previousCases: data.previousCases,
          languages: data.languages,
          motivation: data.motivation,
          cvUrl: data.cvUrl,
          degreeUrl: data.degreeUrl,
          photoUrl: data.photoUrl,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    // Crear notificación para el admin
    const admins = await prisma.user.findMany({
      where: {
        centerId: center.id,
        role: { in: ["SUPER_ADMIN", "ADMIN"] },
        isActive: true,
      },
    });

    // Notificar a los admins
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "SYSTEM",
        title: "Nueva solicitud de árbitro",
        message: `${data.fullName} ha solicitado unirse a la nómina de árbitros.`,
        metadata: {
          applicationId: arbitratorRegistry.id,
          applicantName: data.fullName,
          applicantEmail: data.email,
        },
        isRead: false,
      })),
    });

    // TODO: Enviar email de confirmación al solicitante
    // TODO: Enviar email a los administradores

    return NextResponse.json({
      success: true,
      message: "Solicitud recibida exitosamente",
      applicationId: arbitratorRegistry.id,
      data: {
        name: data.fullName,
        email: data.email,
        status: "PENDING_APPROVAL",
      },
    });
  } catch (error) {
    console.error("Error processing arbitrator application:", error);

    // Manejar error de duplicado
    if ((error as any)?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una solicitud con estos datos" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// GET para verificar el estado de una aplicación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const documentNumber = searchParams.get("document");

    if (!email && !documentNumber) {
      return NextResponse.json(
        { error: "Proporcione email o número de documento" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          documentNumber ? { documentNumber } : {},
        ].filter((obj) => Object.keys(obj).length > 0),
      },
      include: {
        arbitratorRegistry: {
          select: {
            id: true,
            status: true,
            applicationDate: true,
            approvalDate: true,
            specializations: true,
          },
        },
      },
    });

    if (!user || !user.arbitratorRegistry) {
      return NextResponse.json(
        { error: "No se encontró solicitud con estos datos" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      application: {
        id: user.arbitratorRegistry.id,
        name: user.name,
        email: user.email,
        status: user.arbitratorRegistry.status,
        applicationDate: user.arbitratorRegistry.applicationDate,
        approvalDate: user.arbitratorRegistry.approvalDate,
        specializations: user.arbitratorRegistry.specializations,
      },
    });
  } catch (error) {
    console.error("Error checking application status:", error);
    return NextResponse.json(
      { error: "Error al verificar el estado" },
      { status: 500 }
    );
  }
}
