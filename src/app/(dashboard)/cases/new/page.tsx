"use client";

/**
 * CAARD - Formulario de Nueva Solicitud de Arbitraje
 * Wizard multi-paso para crear expediente
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale,
  User,
  Building2,
  FileText,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { createCaseSchema, type CreateCaseInput } from "@/lib/validations/case";

// Pasos del wizard
const STEPS = [
  { id: 1, title: "Tipo de Arbitraje", icon: Scale },
  { id: 2, title: "Demandante", icon: User },
  { id: 3, title: "Demandado", icon: Building2 },
  { id: 4, title: "Detalles del Caso", icon: FileText },
  { id: 5, title: "Confirmación", icon: CheckCircle2 },
];

type ArbitrationType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseFeeCents: number | null;
  currency: string;
};

export default function NewCasePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arbitrationTypes, setArbitrationTypes] = useState<ArbitrationType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const form = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      arbitrationTypeId: "",
      title: "",
      description: "",
      hasDefinedAmount: true,
      claimAmount: undefined,
      currency: "PEN",
      subject: "",
      claims: "",
      claimant: {
        type: "PERSONA_NATURAL",
        nombres: "",
        apellidos: "",
        razonSocial: "",
        representanteLegal: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
        email: "",
        telefono: "",
        direccion: "",
      },
      respondent: {
        type: "PERSONA_JURIDICA",
        nombres: "",
        apellidos: "",
        razonSocial: "",
        representanteLegal: "",
        tipoDocumento: "RUC",
        numeroDocumento: "",
        email: "",
        telefono: "",
        direccion: "",
      },
      contractDate: "",
      contractDescription: "",
      hasArbitrationClause: true,
      arbitrationClauseDescription: "",
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  // Cargar tipos de arbitraje
  useEffect(() => {
    async function loadArbitrationTypes() {
      try {
        const res = await fetch("/api/arbitration-types");
        if (res.ok) {
          const data = await res.json();
          setArbitrationTypes(data);
        }
      } catch (error) {
        console.error("Error loading arbitration types:", error);
        toast.error("Error al cargar tipos de arbitraje. Recargue la página.");
        setArbitrationTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    }
    loadArbitrationTypes();
  }, []);

  // Campos requeridos por paso para validación parcial
  const STEP_FIELDS: Record<number, (keyof CreateCaseInput)[]> = {
    1: ["arbitrationTypeId"],
    2: ["claimant"],
    3: ["respondent"],
    4: ["title", "hasDefinedAmount", "currency"],
    5: ["acceptTerms", "acceptPrivacy"],
  };

  const nextStep = async () => {
    // Validar campos del paso actual antes de avanzar
    const fieldsToValidate = STEP_FIELDS[currentStep] || [];
    const isValid = await form.trigger(fieldsToValidate as any);

    if (!isValid) {
      // Mostrar errores específicos del paso
      const errors = form.formState.errors;
      const errorMessages: string[] = [];

      if (currentStep === 1 && errors.arbitrationTypeId) {
        errorMessages.push("Seleccione un tipo de arbitraje");
      }
      if (currentStep === 2 && errors.claimant) {
        errorMessages.push("Complete los datos del demandante");
      }
      if (currentStep === 3 && errors.respondent) {
        errorMessages.push("Complete los datos del demandado");
      }
      if (currentStep === 4) {
        if (errors.title) errorMessages.push("El título es obligatorio (mín. 10 caracteres)");
      }

      if (errorMessages.length > 0) {
        toast.error(errorMessages.join(". "));
      } else {
        toast.error("Complete los campos requeridos antes de continuar");
      }
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CreateCaseInput) => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "Expediente creado exitosamente");
        router.push(`/cases/${result.data.id}`);
      } else {
        // Mostrar detalles del error si hay
        const errorDetail = result.details?.fieldErrors
          ? Object.values(result.details.fieldErrors).flat().join(", ")
          : result.error;
        toast.error(errorDetail || "Error al crear expediente");
      }
    } catch (error) {
      toast.error("Error de conexión al servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar errores de validación cuando el submit falla silenciosamente
  const handleSubmitWithErrors = form.handleSubmit(onSubmit, (errors) => {
    console.error("Form validation errors:", errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.includes("acceptTerms") || errorKeys.includes("acceptPrivacy")) {
      toast.error("Debe aceptar los términos y la política de privacidad");
    } else {
      toast.error(`Hay ${errorKeys.length} campo(s) con errores. Revise los pasos anteriores.`);
    }
  });

  const claimantType = form.watch("claimant.type");
  const respondentType = form.watch("respondent.type");
  const hasDefinedAmount = form.watch("hasDefinedAmount");
  const selectedTypeId = form.watch("arbitrationTypeId");
  const selectedType = arbitrationTypes.find((t) => t.id === selectedTypeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Solicitud de Arbitraje"
        description="Complete el formulario para iniciar un proceso arbitral"
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                currentStep >= step.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <span
              className={`ml-2 hidden text-sm font-medium sm:inline ${
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-4 h-1 w-8 rounded sm:w-16 ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmitWithErrors}>
          {/* Step 1: Tipo de Arbitraje */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccione el Tipo de Arbitraje</CardTitle>
                <CardDescription>
                  Elija el tipo de proceso arbitral que mejor se ajuste a su controversia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingTypes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {arbitrationTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                          selectedTypeId === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => form.setValue("arbitrationTypeId", type.id)}
                      >
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {type.description}
                        </p>
                        {type.baseFeeCents && (
                          <p className="mt-2 text-sm font-medium text-primary">
                            Tasa: {type.currency} {(type.baseFeeCents / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.arbitrationTypeId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.arbitrationTypeId.message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Demandante */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Datos del Demandante</CardTitle>
                <CardDescription>
                  Información de la parte que presenta la solicitud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="claimant.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Persona</FormLabel>
                      <Tabs value={field.value} onValueChange={field.onChange}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="PERSONA_NATURAL">
                            <User className="mr-2 h-4 w-4" />
                            Persona Natural
                          </TabsTrigger>
                          <TabsTrigger value="PERSONA_JURIDICA">
                            <Building2 className="mr-2 h-4 w-4" />
                            Persona Jurídica
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormItem>
                  )}
                />

                {claimantType === "PERSONA_NATURAL" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="claimant.nombres"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombres *</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Carlos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="claimant.apellidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos *</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez García" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="claimant.razonSocial"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Razón Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Empresa ABC S.A.C." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="claimant.representanteLegal"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del representante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="claimant.tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="RUC">RUC</SelectItem>
                            <SelectItem value="CE">Carné de Extranjería</SelectItem>
                            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="claimant.numeroDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Documento *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="claimant.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="claimant.telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+51999888777" {...field} />
                        </FormControl>
                        <FormDescription>Formato: +51XXXXXXXXX</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="claimant.direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Principal 123, Lima" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Demandado */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Datos del Demandado</CardTitle>
                <CardDescription>
                  Información de la parte contra quien se dirige la demanda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="respondent.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Persona</FormLabel>
                      <Tabs value={field.value} onValueChange={field.onChange}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="PERSONA_NATURAL">
                            <User className="mr-2 h-4 w-4" />
                            Persona Natural
                          </TabsTrigger>
                          <TabsTrigger value="PERSONA_JURIDICA">
                            <Building2 className="mr-2 h-4 w-4" />
                            Persona Jurídica
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormItem>
                  )}
                />

                {respondentType === "PERSONA_NATURAL" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="respondent.nombres"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombres *</FormLabel>
                          <FormControl>
                            <Input placeholder="María Elena" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="respondent.apellidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos *</FormLabel>
                          <FormControl>
                            <Input placeholder="López Torres" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="respondent.razonSocial"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Razón Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Constructora XYZ S.A." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="respondent.representanteLegal"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del representante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="respondent.tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="RUC">RUC</SelectItem>
                            <SelectItem value="CE">Carné de Extranjería</SelectItem>
                            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="respondent.numeroDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Documento *</FormLabel>
                        <FormControl>
                          <Input placeholder="20123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="respondent.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contacto@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="respondent.telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+51999777666" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="respondent.direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Calle Los Olivos 456, Lima" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Detalles del Caso */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Controversia</CardTitle>
                <CardDescription>
                  Describa los hechos y pretensiones de su solicitud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Caso *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Incumplimiento de contrato de servicios"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Resuma en una frase el motivo de la controversia
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="hasDefinedAmount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Cuantía determinada</FormLabel>
                          <FormDescription>
                            Marque si puede especificar el monto
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {hasDefinedAmount && (
                    <>
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moneda</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PEN">Soles (PEN)</SelectItem>
                                <SelectItem value="USD">Dólares (USD)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="claimAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materia de la Controversia</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa la materia sobre la que versa la controversia..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="claims"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pretensiones</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalle lo que solicita al Tribunal Arbitral..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Especifique claramente qué espera obtener del proceso arbitral
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha del Contrato</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hasArbitrationClause"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Tiene cláusula arbitral</FormLabel>
                          <FormDescription>
                            El contrato incluye convenio arbitral
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de los Hechos</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Narre los hechos que originaron la controversia en orden cronológico..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 5: Confirmación */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmación y Envío</CardTitle>
                <CardDescription>
                  Revise la información y acepte los términos para enviar su solicitud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resumen */}
                <div className="rounded-lg bg-muted p-4 space-y-4">
                  <h4 className="font-semibold">Resumen de la Solicitud</h4>

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo de Arbitraje:</span>
                      <span className="font-medium">{selectedType?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Título:</span>
                      <span className="font-medium">{form.watch("title") || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Demandante:</span>
                      <span className="font-medium">
                        {claimantType === "PERSONA_NATURAL"
                          ? `${form.watch("claimant.nombres")} ${form.watch("claimant.apellidos")}`
                          : form.watch("claimant.razonSocial") || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Demandado:</span>
                      <span className="font-medium">
                        {respondentType === "PERSONA_NATURAL"
                          ? `${form.watch("respondent.nombres")} ${form.watch("respondent.apellidos")}`
                          : form.watch("respondent.razonSocial") || "-"}
                      </span>
                    </div>
                    {hasDefinedAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cuantía:</span>
                        <span className="font-medium">
                          {form.watch("currency")} {form.watch("claimAmount")?.toLocaleString() || "0"}
                        </span>
                      </div>
                    )}
                    {selectedType?.baseFeeCents && (
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-muted-foreground">Tasa de Arbitraje:</span>
                        <span className="font-semibold text-primary">
                          {selectedType.currency} {(selectedType.baseFeeCents / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Términos y condiciones */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto los{" "}
                            <a href="/terms" className="text-primary underline" target="_blank">
                              Términos y Condiciones
                            </a>{" "}
                            del Centro de Arbitraje *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptPrivacy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto la{" "}
                            <a href="/privacy" className="text-primary underline" target="_blank">
                              Política de Privacidad
                            </a>{" "}
                            y el tratamiento de mis datos personales *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                  <strong>Importante:</strong> Al enviar esta solicitud, se generará un expediente
                  y recibirá una notificación con los pasos a seguir. La tasa de arbitraje
                  deberá ser pagada en un plazo de 5 días hábiles para continuar con el proceso.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
