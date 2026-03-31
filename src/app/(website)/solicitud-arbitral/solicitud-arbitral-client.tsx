"use client";

/**
 * CAARD - Formulario Público de Solicitud Arbitral (Client Component)
 * Con traducciones
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scale, Loader2, CheckCircle, AlertCircle, Building2, User, FileText, CreditCard, ChevronRight, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { publicRequestSchema, PublicRequestInput, MATERIAS_ARBITRAJE } from "@/lib/validations/public-request";
import { useTranslation } from "@/lib/i18n";

// Tipos de arbitraje desde la API
interface ArbitrationType {
  id: string;
  code: string;
  name: string;
  description: string;
  baseFeeCents: number;
  currency: string;
}

export function SolicitudArbitralClient() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [arbitrationTypes, setArbitrationTypes] = useState<ArbitrationType[]>([]);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; code?: string; message?: string } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Pasos del formulario con traducciones
  const STEPS = [
    { id: 1, title: t.website.stepArbitrationType, icon: Scale },
    { id: 2, title: t.website.stepClaimant, icon: User },
    { id: 3, title: t.website.stepRespondent, icon: Building2 },
    { id: 4, title: t.website.stepDispute, icon: FileText },
    { id: 5, title: t.website.stepPaymentConfirmation, icon: CreditCard },
  ];

  const form = useForm<PublicRequestInput>({
    resolver: zodResolver(publicRequestSchema),
    defaultValues: {
      tipoArbitraje: "",
      demandante: {
        tipo: "PERSONA_NATURAL",
        tipoDocumento: "DNI",
        email: "",
        telefono: "",
        direccion: "",
      },
      demandado: {
        tipo: "PERSONA_NATURAL",
        tipoDocumento: "DNI",
        email: "",
        telefono: "",
        direccion: "",
      },
      materia: "",
      descripcionControversia: "",
      cuantiaDefinida: true,
      moneda: "PEN",
      pretensiones: "",
      existeContrato: false,
      existeClausulaArbitral: false,
      aceptaTerminos: false,
      aceptaPoliticaPrivacidad: false,
      declaraVeracidad: false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  // Cargar tipos de arbitraje
  useEffect(() => {
    async function loadArbitrationTypes() {
      try {
        const response = await fetch("/api/public/solicitud");
        if (response.ok) {
          const data = await response.json();
          setArbitrationTypes(data.arbitrationTypes || []);
        }
      } catch (error) {
        console.error("Error loading arbitration types:", error);
      } finally {
        setIsLoadingTypes(false);
      }
    }
    loadArbitrationTypes();
  }, []);

  // Observar valores del formulario
  const demandanteTipo = watch("demandante.tipo");
  const demandadoTipo = watch("demandado.tipo");
  const cuantiaDefinida = watch("cuantiaDefinida");
  const existeContrato = watch("existeContrato");
  const existeClausula = watch("existeClausulaArbitral");
  const selectedArbitrationType = watch("tipoArbitraje");

  // Obtener datos del tipo de arbitraje seleccionado
  const selectedType = arbitrationTypes.find(t => t.id === selectedArbitrationType);

  // Formatear moneda
  const formatCurrency = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Manejar envío
  const onSubmit = async (data: PublicRequestInput) => {
    setIsLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/public/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          code: result.data.code,
          message: result.message,
        });
      } else {
        if (response.status === 402) {
          setPaymentError(result.paymentError || t.website.paymentError);
        } else {
          setSubmitResult({
            success: false,
            message: result.error || t.errors.general,
          });
        }
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setSubmitResult({
        success: false,
        message: t.errors.networkError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navegación entre pasos
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Si ya se envió exitosamente
  if (submitResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t.website.requestRegistered}</CardTitle>
            <CardDescription>
              {t.website.requestReceived}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">{t.website.caseNumber}</p>
              <p className="text-2xl font-bold text-primary">{submitResult.code}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {submitResult.message}
            </p>
            <p className="text-sm">
              {t.website.emailNotification}
            </p>
            <div className="pt-4">
              <Button onClick={() => window.location.href = "https://caardpe.com"}>
                {t.website.backToHome}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#D66829]/5 to-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.website.arbitrationRequestTitle}</h1>
          <p className="text-muted-foreground">
            {t.website.completeFormToStart}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div
                        className={`h-1 flex-1 ${
                          isCompleted ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted bg-background text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-1 flex-1 ${
                          isCompleted ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center ${
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PASO 1: Tipo de Arbitraje */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {isLoadingTypes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <RadioGroup
                      value={selectedArbitrationType}
                      onValueChange={(value) => setValue("tipoArbitraje", value)}
                    >
                      <div className="grid gap-4">
                        {arbitrationTypes.map((type) => (
                          <div key={type.id} className="relative">
                            <RadioGroupItem
                              value={type.id}
                              id={type.id}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={type.id}
                              className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                            >
                              <Scale className="h-6 w-6 text-primary mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{type.name}</p>
                                  <span className="text-sm font-semibold text-primary">
                                    {formatCurrency(type.baseFeeCents, type.currency)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {type.description}
                                </p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                  {errors.tipoArbitraje && (
                    <p className="text-sm text-destructive">{errors.tipoArbitraje.message}</p>
                  )}
                </div>
              )}

              {/* PASO 2: Datos del Demandante */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Tipo de persona */}
                  <div className="space-y-3">
                    <Label>{t.website.personType}</Label>
                    <RadioGroup
                      value={demandanteTipo}
                      onValueChange={(value: "PERSONA_NATURAL" | "PERSONA_JURIDICA") =>
                        setValue("demandante.tipo", value)
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PERSONA_NATURAL" id="dem-natural" />
                        <Label htmlFor="dem-natural">{t.website.naturalPerson}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PERSONA_JURIDICA" id="dem-juridica" />
                        <Label htmlFor="dem-juridica">{t.website.legalPerson}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campos según tipo */}
                  {demandanteTipo === "PERSONA_NATURAL" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dem-nombres">{t.website.names} *</Label>
                        <Input id="dem-nombres" {...register("demandante.nombres")} />
                        {errors.demandante?.nombres && (
                          <p className="text-xs text-destructive">{errors.demandante.nombres.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dem-apPaterno">{t.website.paternalSurname} *</Label>
                        <Input id="dem-apPaterno" {...register("demandante.apellidoPaterno")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dem-apMaterno">{t.website.maternalSurname}</Label>
                        <Input id="dem-apMaterno" {...register("demandante.apellidoMaterno")} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="dem-razonSocial">{t.website.businessName} *</Label>
                        <Input id="dem-razonSocial" {...register("demandante.razonSocial")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dem-representante">{t.website.legalRepresentative} *</Label>
                        <Input id="dem-representante" {...register("demandante.representanteLegal")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dem-cargo">{t.website.position}</Label>
                        <Input id="dem-cargo" {...register("demandante.cargoRepresentante")} />
                      </div>
                    </div>
                  )}

                  {/* Documento */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t.website.documentType} *</Label>
                      <Select
                        value={watch("demandante.tipoDocumento")}
                        onValueChange={(value: "DNI" | "CE" | "RUC" | "PASAPORTE") =>
                          setValue("demandante.tipoDocumento", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CE">{t.website.foreignersCard}</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                          <SelectItem value="PASAPORTE">{t.website.passport}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dem-numDoc">{t.website.documentNumber} *</Label>
                      <Input id="dem-numDoc" {...register("demandante.numeroDocumento")} />
                      {errors.demandante?.numeroDocumento && (
                        <p className="text-xs text-destructive">{errors.demandante.numeroDocumento.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dem-email">{t.website.email} *</Label>
                      <Input id="dem-email" type="email" {...register("demandante.email")} />
                      {errors.demandante?.email && (
                        <p className="text-xs text-destructive">{errors.demandante.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dem-telefono">{t.website.phone} *</Label>
                      <Input id="dem-telefono" {...register("demandante.telefono")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dem-celular">{t.website.cellphone}</Label>
                      <Input id="dem-celular" {...register("demandante.celular")} />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-2">
                    <Label htmlFor="dem-direccion">{t.website.addressLabel} *</Label>
                    <Input id="dem-direccion" {...register("demandante.direccion")} />
                    {errors.demandante?.direccion && (
                      <p className="text-xs text-destructive">{errors.demandante.direccion.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 3: Datos del Demandado */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Tipo de persona */}
                  <div className="space-y-3">
                    <Label>{t.website.personType}</Label>
                    <RadioGroup
                      value={demandadoTipo}
                      onValueChange={(value: "PERSONA_NATURAL" | "PERSONA_JURIDICA") =>
                        setValue("demandado.tipo", value)
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PERSONA_NATURAL" id="ddo-natural" />
                        <Label htmlFor="ddo-natural">{t.website.naturalPerson}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PERSONA_JURIDICA" id="ddo-juridica" />
                        <Label htmlFor="ddo-juridica">{t.website.legalPerson}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campos según tipo */}
                  {demandadoTipo === "PERSONA_NATURAL" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ddo-nombres">{t.website.names} *</Label>
                        <Input id="ddo-nombres" {...register("demandado.nombres")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddo-apPaterno">{t.website.paternalSurname} *</Label>
                        <Input id="ddo-apPaterno" {...register("demandado.apellidoPaterno")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddo-apMaterno">{t.website.maternalSurname}</Label>
                        <Input id="ddo-apMaterno" {...register("demandado.apellidoMaterno")} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="ddo-razonSocial">{t.website.businessName} *</Label>
                        <Input id="ddo-razonSocial" {...register("demandado.razonSocial")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddo-representante">{t.website.legalRepresentative} *</Label>
                        <Input id="ddo-representante" {...register("demandado.representanteLegal")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ddo-cargo">{t.website.position}</Label>
                        <Input id="ddo-cargo" {...register("demandado.cargoRepresentante")} />
                      </div>
                    </div>
                  )}

                  {/* Documento */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t.website.documentType} *</Label>
                      <Select
                        value={watch("demandado.tipoDocumento")}
                        onValueChange={(value: "DNI" | "CE" | "RUC" | "PASAPORTE") =>
                          setValue("demandado.tipoDocumento", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CE">{t.website.foreignersCard}</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                          <SelectItem value="PASAPORTE">{t.website.passport}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddo-numDoc">{t.website.documentNumber} *</Label>
                      <Input id="ddo-numDoc" {...register("demandado.numeroDocumento")} />
                      {errors.demandado?.numeroDocumento && (
                        <p className="text-xs text-destructive">{errors.demandado.numeroDocumento.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ddo-email">{t.website.email} *</Label>
                      <Input id="ddo-email" type="email" {...register("demandado.email")} />
                      {errors.demandado?.email && (
                        <p className="text-xs text-destructive">{errors.demandado.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddo-telefono">{t.website.phone} *</Label>
                      <Input id="ddo-telefono" {...register("demandado.telefono")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddo-celular">{t.website.cellphone}</Label>
                      <Input id="ddo-celular" {...register("demandado.celular")} />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-2">
                    <Label htmlFor="ddo-direccion">{t.website.addressLabel} *</Label>
                    <Input id="ddo-direccion" {...register("demandado.direccion")} />
                    {errors.demandado?.direccion && (
                      <p className="text-xs text-destructive">{errors.demandado.direccion.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 4: Controversia */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Materia */}
                  <div className="space-y-2">
                    <Label>{t.website.disputeSubject} *</Label>
                    <Select
                      value={watch("materia")}
                      onValueChange={(value) => setValue("materia", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.website.selectSubject} />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAS_ARBITRAJE.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.materia && (
                      <p className="text-xs text-destructive">{errors.materia.message}</p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">{t.website.disputeDescription} *</Label>
                    <Textarea
                      id="descripcion"
                      rows={5}
                      placeholder={t.website.describeDispute}
                      {...register("descripcionControversia")}
                    />
                    {errors.descripcionControversia && (
                      <p className="text-xs text-destructive">{errors.descripcionControversia.message}</p>
                    )}
                  </div>

                  {/* Cuantía */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cuantiaDefinida"
                        checked={cuantiaDefinida}
                        onCheckedChange={(checked) => setValue("cuantiaDefinida", !!checked)}
                      />
                      <Label htmlFor="cuantiaDefinida">{t.website.definedAmount}</Label>
                    </div>

                    {cuantiaDefinida && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t.website.currency}</Label>
                          <Select
                            value={watch("moneda")}
                            onValueChange={(value: "PEN" | "USD") => setValue("moneda", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PEN">{t.website.soles}</SelectItem>
                              <SelectItem value="USD">{t.website.dollars}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="monto">{t.website.amountLabel}</Label>
                          <Input
                            id="monto"
                            type="number"
                            step="0.01"
                            {...register("montoCuantia", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pretensiones */}
                  <div className="space-y-2">
                    <Label htmlFor="pretensiones">{t.website.claims} *</Label>
                    <Textarea
                      id="pretensiones"
                      rows={4}
                      placeholder={t.website.claimsPlaceholder}
                      {...register("pretensiones")}
                    />
                    {errors.pretensiones && (
                      <p className="text-xs text-destructive">{errors.pretensiones.message}</p>
                    )}
                  </div>

                  {/* Contrato */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="existeContrato"
                        checked={existeContrato}
                        onCheckedChange={(checked) => setValue("existeContrato", !!checked)}
                      />
                      <Label htmlFor="existeContrato">{t.website.relatedContract}</Label>
                    </div>

                    {existeContrato && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fechaContrato">{t.website.contractDate}</Label>
                          <Input id="fechaContrato" type="date" {...register("fechaContrato")} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="descContrato">{t.website.contractDescription}</Label>
                          <Input
                            id="descContrato"
                            placeholder={t.website.contractDescPlaceholder}
                            {...register("descripcionContrato")}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cláusula Arbitral */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="existeClausula"
                        checked={existeClausula}
                        onCheckedChange={(checked) => setValue("existeClausulaArbitral", !!checked)}
                      />
                      <Label htmlFor="existeClausula">{t.website.arbitrationClauseExists}</Label>
                    </div>

                    {existeClausula && (
                      <div className="space-y-2">
                        <Label htmlFor="textoClausula">{t.website.arbitrationClauseText}</Label>
                        <Textarea
                          id="textoClausula"
                          rows={3}
                          placeholder={t.website.transcribeClause}
                          {...register("textoClausulaArbitral")}
                        />
                      </div>
                    )}
                  </div>

                  {/* Medios Probatorios */}
                  <div className="space-y-2">
                    <Label htmlFor="medios">{t.website.evidenceMeans}</Label>
                    <Textarea
                      id="medios"
                      rows={3}
                      placeholder={t.website.evidencePlaceholder}
                      {...register("mediosProbatorios")}
                    />
                  </div>
                </div>
              )}

              {/* PASO 5: Pago y Confirmación */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* Resumen de pago */}
                  {selectedType && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <h3 className="font-medium mb-2">{t.website.paymentSummary}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>{t.website.arbitrationTypeLabel}:</span>
                          <span>{selectedType.name}</span>
                        </div>
                        <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                          <span>{t.website.arbitrationFee}:</span>
                          <span className="text-primary">
                            {formatCurrency(selectedType.baseFeeCents, selectedType.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información de pago */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">{t.website.culqiPayment}</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          {t.website.culqiPaymentDesc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <h4 className="font-medium text-destructive">{t.website.paymentError}</h4>
                          <p className="text-sm text-destructive/80 mt-1">{paymentError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aceptaciones */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="aceptaTerminos"
                        checked={watch("aceptaTerminos")}
                        onCheckedChange={(checked) => setValue("aceptaTerminos", !!checked)}
                      />
                      <Label htmlFor="aceptaTerminos" className="text-sm leading-relaxed">
                        {t.website.acceptTermsLabel}{" "}
                        <a href="/terminos" target="_blank" className="text-primary underline">
                          {t.website.termsAndConditions}
                        </a>{" "}
                        {t.website.ofArbitrationService} *
                      </Label>
                    </div>
                    {errors.aceptaTerminos && (
                      <p className="text-xs text-destructive ml-7">{errors.aceptaTerminos.message}</p>
                    )}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="aceptaPrivacidad"
                        checked={watch("aceptaPoliticaPrivacidad")}
                        onCheckedChange={(checked) => setValue("aceptaPoliticaPrivacidad", !!checked)}
                      />
                      <Label htmlFor="aceptaPrivacidad" className="text-sm leading-relaxed">
                        {t.website.acceptPrivacyLabel}{" "}
                        <a href="/privacidad" target="_blank" className="text-primary underline">
                          {t.website.privacyPolicyLabel}
                        </a>{" "}
                        {t.website.andDataProcessing} *
                      </Label>
                    </div>
                    {errors.aceptaPoliticaPrivacidad && (
                      <p className="text-xs text-destructive ml-7">{errors.aceptaPoliticaPrivacidad.message}</p>
                    )}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="declaraVeracidad"
                        checked={watch("declaraVeracidad")}
                        onCheckedChange={(checked) => setValue("declaraVeracidad", !!checked)}
                      />
                      <Label htmlFor="declaraVeracidad" className="text-sm leading-relaxed">
                        {t.website.truthDeclaration} *
                      </Label>
                    </div>
                    {errors.declaraVeracidad && (
                      <p className="text-xs text-destructive ml-7">{errors.declaraVeracidad.message}</p>
                    )}
                  </div>

                  {submitResult && !submitResult.success && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-sm text-destructive">{submitResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navegación */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t.website.previousBtn}
                </Button>

                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={nextStep}>
                    {t.website.nextBtn}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.website.processing}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {t.website.payAndSubmit}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Nota de ayuda */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          {t.website.needHelp} {t.website.contactUsAt}{" "}
          <a href="tel:+51913755003" className="text-[#D66829] hover:underline">
            (51) 913 755 003
          </a>{" "}
          {t.website.orWriteTo}{" "}
          <a href="mailto:mesadepartes@caardpe.com" className="text-[#D66829] hover:underline">
            mesadepartes@caardpe.com
          </a>
        </p>
      </div>
    </div>
  );
}
