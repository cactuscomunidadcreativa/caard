/**
 * /libro-de-reclamaciones — Libro de Reclamaciones de CAARD.
 * Cumple D.S. 011-2011-PCM. Formulario público.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LibroReclamacionesPage() {
  const [claimType, setClaimType] = useState<"RECLAMO" | "QUEJA">("RECLAMO");
  const [consumerIsMinor, setConsumerIsMinor] = useState(false);
  const [serviceType, setServiceType] = useState<"PRODUCTO" | "SERVICIO">("SERVICIO");
  const [docType, setDocType] = useState("DNI");
  const [currency, setCurrency] = useState("PEN");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    claimNumber: string;
    receivedAt: string;
    responseDueAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amount = fd.get("amount") as string;
    const payload: any = {
      claimType,
      consumerName: fd.get("consumerName"),
      consumerDocType: docType,
      consumerDocNumber: fd.get("consumerDocNumber"),
      consumerAddress: fd.get("consumerAddress") || null,
      consumerPhone: fd.get("consumerPhone") || null,
      consumerEmail: fd.get("consumerEmail"),
      consumerIsMinor,
      guardianName: consumerIsMinor ? fd.get("guardianName") : null,
      guardianDocType: consumerIsMinor ? fd.get("guardianDocType") : null,
      guardianDocNumber: consumerIsMinor ? fd.get("guardianDocNumber") : null,
      serviceType,
      serviceDescription: fd.get("serviceDescription"),
      amountCents: amount ? Math.round(parseFloat(amount) * 100) : null,
      currency,
      serviceDate: fd.get("serviceDate") || null,
      claimDetail: fd.get("claimDetail"),
      consumerRequest: fd.get("consumerRequest"),
    };
    try {
      const r = await fetch("/api/public/consumer-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al enviar");
      setSuccess(d);
      // Scroll arriba
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen py-[8vh] bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <CardTitle className="text-2xl">
                ¡Hoja registrada exitosamente!
              </CardTitle>
              <CardDescription>
                Su reclamación ha sido recibida y notificada al centro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border-l-4 border-[#D66829] p-4 rounded">
                <p className="text-sm text-slate-600">Número de hoja:</p>
                <p className="text-2xl font-mono font-bold text-[#0B2A5B]">
                  {success.claimNumber}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded border p-3">
                  <p className="text-slate-500">Fecha de recepción</p>
                  <p className="font-medium">
                    {new Date(success.receivedAt).toLocaleString("es-PE", {
                      timeZone: "America/Lima",
                    })}
                  </p>
                </div>
                <div className="rounded border p-3">
                  <p className="text-slate-500">Plazo de respuesta</p>
                  <p className="font-medium">
                    {new Date(success.responseDueAt).toLocaleDateString("es-PE")}{" "}
                    <span className="text-xs text-slate-500">
                      (30 días calendario)
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Recibirá un correo a su email registrado con el cargo de recibido.
                Atenderemos su {claimType.toLowerCase()} dentro del plazo legal.
              </p>
              <div className="flex gap-3 pt-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">Volver al inicio</Link>
                </Button>
                <Button
                  className="flex-1 bg-[#D66829] hover:bg-[#c45a22]"
                  onClick={() => {
                    setSuccess(null);
                    setError(null);
                  }}
                >
                  Registrar otra
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[8vh] overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-4">
              <BookOpen className="h-4 w-4" />
              D.S. 011-2011-PCM
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Libro de Reclamaciones
            </h1>
            <p className="text-base md:text-lg text-white/90 leading-relaxed">
              Conforme a lo establecido en el Código de Protección y Defensa del
              Consumidor, este establecimiento cuenta con un Libro de
              Reclamaciones a su disposición.
            </p>
          </div>
        </div>
      </section>

      {/* Datos del proveedor (auto) */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0B2A5B]" />
                Datos del Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Razón Social</p>
                <p className="font-medium">
                  Centro de Administración de Arbitrajes y Resolución de
                  Disputas S.A.C. (CAARD)
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">RUC</p>
                <p className="font-medium">20608962621</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500 text-xs">Dirección</p>
                <p className="font-medium">
                  Jr. Aldebarán No. 596, Oficina 1409, Edificio IQ Surco,
                  Santiago de Surco, Lima — Perú
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Email</p>
                <p className="font-medium">info@caardpe.com</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Teléfono</p>
                <p className="font-medium">(51) 913 755 003</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Formulario */}
      <section className="py-8 bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#D66829]" />
                  Tipo de Hoja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={claimType}
                  onValueChange={(v) => setClaimType(v as any)}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  <label
                    htmlFor="rec"
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                      claimType === "RECLAMO"
                        ? "border-[#D66829] bg-orange-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <RadioGroupItem value="RECLAMO" id="rec" className="mt-1" />
                    <div>
                      <p className="font-semibold text-sm">RECLAMO</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Disconformidad relacionada con los productos o servicios.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="que"
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                      claimType === "QUEJA"
                        ? "border-[#D66829] bg-orange-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <RadioGroupItem value="QUEJA" id="que" className="mt-1" />
                    <div>
                      <p className="font-semibold text-sm">QUEJA</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Disconformidad NO relacionada con los productos o
                        servicios; o sobre la atención al consumidor.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Consumidor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-[#D66829]" />
                  Datos del Consumidor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre completo *</Label>
                    <Input name="consumerName" required maxLength={200} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      name="consumerEmail"
                      type="email"
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label>Tipo de documento *</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="CE">Carné de Extranjería</SelectItem>
                        <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                        <SelectItem value="RUC">RUC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número de documento *</Label>
                    <Input name="consumerDocNumber" required maxLength={50} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input name="consumerPhone" maxLength={50} />
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <Input name="consumerAddress" maxLength={500} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 bg-yellow-50 border-yellow-200">
                  <div>
                    <Label className="text-sm">El consumidor es menor de edad</Label>
                    <p className="text-xs text-slate-600">
                      Si el consumidor es menor, debe completar los datos del
                      padre/madre/tutor.
                    </p>
                  </div>
                  <Switch
                    checked={consumerIsMinor}
                    onCheckedChange={setConsumerIsMinor}
                  />
                </div>

                {consumerIsMinor && (
                  <div className="grid md:grid-cols-3 gap-4 rounded-lg border-2 border-yellow-300 p-4 bg-yellow-50/40">
                    <div className="md:col-span-3">
                      <Label className="text-sm font-semibold">
                        Datos del padre, madre o tutor *
                      </Label>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Nombre completo *</Label>
                      <Input name="guardianName" required maxLength={200} />
                    </div>
                    <div>
                      <Label>Tipo doc. *</Label>
                      <Input
                        name="guardianDocType"
                        defaultValue="DNI"
                        required
                        maxLength={20}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Número de documento *</Label>
                      <Input
                        name="guardianDocNumber"
                        required
                        maxLength={50}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#D66829]" />
                  Identificación del Bien o Servicio Reclamado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={serviceType}
                  onValueChange={(v) => setServiceType(v as any)}
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="PRODUCTO" id="prod" />
                    <span>Producto</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="SERVICIO" id="serv" />
                    <span>Servicio</span>
                  </label>
                </RadioGroup>

                <div>
                  <Label>Descripción *</Label>
                  <Textarea
                    name="serviceDescription"
                    required
                    rows={3}
                    maxLength={2000}
                    placeholder="Describa el bien o servicio sobre el que reclama..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Monto reclamado (opcional)</Label>
                    <Input name="amount" type="number" step="0.01" min="0" />
                  </div>
                  <div>
                    <Label>Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEN">PEN (S/)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha del servicio</Label>
                    <Input name="serviceDate" type="date" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalle del reclamo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#D66829]" />
                  Detalle del{" "}
                  <Badge
                    className={
                      claimType === "RECLAMO"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-purple-100 text-purple-800"
                    }
                  >
                    {claimType === "RECLAMO" ? "Reclamo" : "Queja"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>
                    Detalle del{" "}
                    {claimType === "RECLAMO" ? "reclamo" : "queja"} *
                  </Label>
                  <Textarea
                    name="claimDetail"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    placeholder="Explique con detalle qué ocurrió, fechas, hechos..."
                  />
                </div>
                <div>
                  <Label>Pedido del consumidor *</Label>
                  <Textarea
                    name="consumerRequest"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={3}
                    placeholder="¿Qué solución solicita?"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aviso legal */}
            <div className="text-xs text-slate-600 bg-slate-100 p-4 rounded-lg space-y-2">
              <p>
                <strong>Importante:</strong> La formulación del reclamo o queja
                no impide el uso de otros mecanismos de solución de
                controversias ni interrumpe los plazos para acudir a INDECOPI o
                a la vía judicial.
              </p>
              <p>
                CAARD responderá su reclamo en un plazo no mayor a{" "}
                <strong>30 días calendario</strong>, contados desde la fecha de
                recepción.
              </p>
            </div>

            {error && (
              <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#D66829] hover:bg-[#c45a22] text-base font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Registrar{" "}
                  {claimType === "RECLAMO" ? "Reclamo" : "Queja"}
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
