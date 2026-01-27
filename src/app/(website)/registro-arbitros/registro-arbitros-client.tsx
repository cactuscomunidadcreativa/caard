"use client";

/**
 * CAARD - Registro de Árbitros Client Component
 * Muestra nómina de árbitros activos + formulario de aplicación
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Award,
  FileText,
  CheckCircle,
  ArrowRight,
  Shield,
  Scale,
  BookOpen,
  Mail,
  Phone,
  User,
  Briefcase,
  GraduationCap,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Zap,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/use-translation";

// Tipo para árbitros públicos
interface PublicArbitrator {
  id: string;
  name: string;
  image?: string;
  specializations: string[];
  barAssociation?: string;
  casesCompleted: number;
  acceptsEmergency: boolean;
  memberSince?: string;
}

const specialties = [
  { id: "commercial", labelKey: "specialtyCommercial" },
  { id: "state_contracting", labelKey: "specialtyStateContracting" },
  { id: "construction", labelKey: "specialtyConstruction" },
  { id: "corporate", labelKey: "specialtyCorporate" },
  { id: "mining", labelKey: "specialtyMining" },
  { id: "energy", labelKey: "specialtyEnergy" },
  { id: "ip", labelKey: "specialtyIP" },
  { id: "insurance", labelKey: "specialtyInsurance" },
  { id: "telecom", labelKey: "specialtyTelecom" },
  { id: "labor", labelKey: "specialtyLabor" },
  { id: "tax", labelKey: "specialtyTax" },
  { id: "intl_trade", labelKey: "specialtyIntlTrade" },
];

export function RegistroArbitrosClient() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Estado para la lista de árbitros
  const [arbitrators, setArbitrators] = useState<PublicArbitrator[]>([]);
  const [loadingArbitrators, setLoadingArbitrators] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArbitrators, setTotalArbitrators] = useState(0);

  // Cargar árbitros
  useEffect(() => {
    const fetchArbitrators = async () => {
      setLoadingArbitrators(true);
      try {
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", "12");
        if (searchTerm) params.set("search", searchTerm);
        if (selectedSpecialization) params.set("specialization", selectedSpecialization);

        const response = await fetch(`/api/public/arbitrators?${params}`);
        const data = await response.json();

        if (response.ok) {
          setArbitrators(data.arbitrators);
          setTotalPages(data.pagination.totalPages);
          setTotalArbitrators(data.pagination.total);
        }
      } catch (error) {
        console.error("Error fetching arbitrators:", error);
      } finally {
        setLoadingArbitrators(false);
      }
    };

    fetchArbitrators();
  }, [currentPage, searchTerm, selectedSpecialization]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSpecialization]);

  const [formData, setFormData] = useState({
    fullName: "",
    documentType: "DNI" as "DNI" | "CE" | "PASSPORT",
    documentNumber: "",
    email: "",
    phone: "",
    address: "",
    profession: "",
    barNumber: "",
    barAssociation: "",
    yearsOfExperience: 0,
    specializations: [] as string[],
    arbitrationExperience: "",
    motivation: "",
    hasNoCriminalRecord: false,
    acceptsEthicsCode: false,
    acceptsTerms: false,
  });

  const handleSpecializationChange = (specId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specId]
        : prev.specializations.filter((s) => s !== specId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/public/arbitrator-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: data.message || "Solicitud enviada exitosamente",
        });
        // Reset form
        setFormData({
          fullName: "",
          documentType: "DNI",
          documentNumber: "",
          email: "",
          phone: "",
          address: "",
          profession: "",
          barNumber: "",
          barAssociation: "",
          yearsOfExperience: 0,
          specializations: [],
          arbitrationExperience: "",
          motivation: "",
          hasNoCriminalRecord: false,
          acceptsEthicsCode: false,
          acceptsTerms: false,
        });
      } else {
        setSubmitResult({
          success: false,
          message: data.error || "Error al enviar la solicitud",
        });
      }
    } catch {
      setSubmitResult({
        success: false,
        message: "Error de conexión. Intente nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const beneficios = [
    {
      icon: Award,
      titleKey: "institutionalPrestige",
      descKey: "institutionalPrestigeDesc",
    },
    {
      icon: Users,
      titleKey: "contactNetwork",
      descKey: "contactNetworkDesc",
    },
    {
      icon: BookOpen,
      titleKey: "continuousTraining",
      descKey: "continuousTrainingDesc",
    },
    {
      icon: Scale,
      titleKey: "designations",
      descKey: "designationsDesc",
    },
  ];

  const requisitos = [
    {
      titleKey: "academicFormation",
      items: ["reqUniversityDegree", "reqArbitrationSpecialization", "reqContinuousTraining"],
    },
    {
      titleKey: "professionalExperience",
      items: ["reqMinYears", "reqArbitrationExperience", "reqSubjectKnowledge"],
    },
    {
      titleKey: "ethicalRequirements",
      items: ["reqEthicalConduct", "reqNoRecords", "reqEthicsCommitment"],
    },
  ];

  const documentos = [
    "docCV",
    "docDegree",
    "docID",
    "docSpecialization",
    "docCriminalRecord",
    "docPoliceRecord",
    "docJudicialRecord",
    "docDeclaration",
    "docCoverLetter",
    "docReferences",
  ];

  // Helper para obtener iniciales
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper para formatear fecha
  const formatMemberSince = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
    });
  };

  // Mapeo de especialidades a etiquetas legibles
  const getSpecializationLabel = (specId: string) => {
    const spec = specialties.find((s) => s.id === specId);
    if (spec) {
      return (t.website as any)[spec.labelKey] || specId;
    }
    return specId;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Users className="h-4 w-4" />
              {t.website.joinOurRoster}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.arbitratorRegistryPageTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8">
              {t.website.arbitratorRegistryPageSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-[#D66829] hover:bg-[#c45a22] text-white">
                    {t.website.sendFile}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t.website.arbitratorRegistryPageTitle}</DialogTitle>
                    <DialogDescription>
                      Complete el formulario para iniciar su proceso de evaluación.
                    </DialogDescription>
                  </DialogHeader>

                  {submitResult?.success ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">¡Solicitud Enviada!</h3>
                      <p className="text-muted-foreground mb-4">{submitResult.message}</p>
                      <Button onClick={() => setShowForm(false)}>Cerrar</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                      {submitResult && !submitResult.success && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{submitResult.message}</AlertDescription>
                        </Alert>
                      )}

                      {/* Información Personal */}
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Información Personal
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo *</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) =>
                                setFormData({ ...formData, fullName: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Tipo Doc. *</Label>
                            <Select
                              value={formData.documentType}
                              onValueChange={(v: any) =>
                                setFormData({ ...formData, documentType: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DNI">DNI</SelectItem>
                                <SelectItem value="CE">CE</SelectItem>
                                <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="documentNumber">Número *</Label>
                            <Input
                              id="documentNumber"
                              value={formData.documentNumber}
                              onChange={(e) =>
                                setFormData({ ...formData, documentNumber: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono *</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Información Profesional */}
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Información Profesional
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="profession">Profesión *</Label>
                            <Input
                              id="profession"
                              value={formData.profession}
                              onChange={(e) =>
                                setFormData({ ...formData, profession: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="yearsOfExperience">Años de Experiencia *</Label>
                            <Input
                              id="yearsOfExperience"
                              type="number"
                              min="0"
                              value={formData.yearsOfExperience}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  yearsOfExperience: parseInt(e.target.value) || 0,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="barNumber">N° Colegiatura</Label>
                            <Input
                              id="barNumber"
                              value={formData.barNumber}
                              onChange={(e) =>
                                setFormData({ ...formData, barNumber: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="barAssociation">Colegio Profesional</Label>
                            <Input
                              id="barAssociation"
                              value={formData.barAssociation}
                              onChange={(e) =>
                                setFormData({ ...formData, barAssociation: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Especialidades */}
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Especialidades *
                        </h3>
                        <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                          {specialties.map((spec) => (
                            <div key={spec.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={spec.id}
                                checked={formData.specializations.includes(spec.id)}
                                onCheckedChange={(checked) =>
                                  handleSpecializationChange(spec.id, checked as boolean)
                                }
                              />
                              <Label htmlFor={spec.id} className="text-sm cursor-pointer">
                                {(t.website as any)[spec.labelKey]}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Experiencia y Motivación */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="arbitrationExperience">
                            Experiencia en Arbitraje
                          </Label>
                          <Textarea
                            id="arbitrationExperience"
                            value={formData.arbitrationExperience}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                arbitrationExperience: e.target.value,
                              })
                            }
                            placeholder="Describa su experiencia en arbitraje o resolución de conflictos..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="motivation">Motivación *</Label>
                          <Textarea
                            id="motivation"
                            value={formData.motivation}
                            onChange={(e) =>
                              setFormData({ ...formData, motivation: e.target.value })
                            }
                            placeholder="¿Por qué desea formar parte de la nómina de árbitros de CAARD?"
                            rows={3}
                            required
                          />
                        </div>
                      </div>

                      {/* Declaraciones */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="hasNoCriminalRecord"
                            checked={formData.hasNoCriminalRecord}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                hasNoCriminalRecord: checked as boolean,
                              })
                            }
                            required
                          />
                          <Label htmlFor="hasNoCriminalRecord" className="text-sm cursor-pointer">
                            Declaro bajo juramento no tener antecedentes penales, policiales ni
                            judiciales. *
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="acceptsEthicsCode"
                            checked={formData.acceptsEthicsCode}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                acceptsEthicsCode: checked as boolean,
                              })
                            }
                            required
                          />
                          <Label htmlFor="acceptsEthicsCode" className="text-sm cursor-pointer">
                            Acepto cumplir con el Código de Ética de CAARD. *
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="acceptsTerms"
                            checked={formData.acceptsTerms}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                acceptsTerms: checked as boolean,
                              })
                            }
                            required
                          />
                          <Label htmlFor="acceptsTerms" className="text-sm cursor-pointer">
                            Acepto los términos y condiciones del proceso de evaluación. *
                          </Label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={
                          isSubmitting ||
                          !formData.hasNoCriminalRecord ||
                          !formData.acceptsEthicsCode ||
                          !formData.acceptsTerms ||
                          formData.specializations.length === 0
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Solicitud
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t.website.moreInfo}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-[6vh] bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {beneficios.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#D66829]/10 flex items-center justify-center mb-3">
                  <item.icon className="h-7 w-7 text-[#D66829]" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {(t.website as any)[item.titleKey]}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {(t.website as any)[item.descKey]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nómina de Árbitros */}
      <section className="py-[8vh] md:py-[10vh] bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.ourArbitrators || "Nómina de Árbitros"}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.ourArbitratorsSubtitle || "Profesionales altamente calificados y con amplia experiencia en resolución de conflictos."}
            </p>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t.website.searchArbitrator || "Buscar árbitro por nombre..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedSpecialization}
                onValueChange={(v) => setSelectedSpecialization(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.website.filterBySpecialty || "Filtrar por especialidad"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.website.allSpecialties || "Todas las especialidades"}</SelectItem>
                  {specialties.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      {(t.website as any)[spec.labelKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Árbitros */}
          {loadingArbitrators ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#D66829]" />
            </div>
          ) : arbitrators.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {searchTerm || selectedSpecialization
                  ? (t.website.noArbitratorsFound || "No se encontraron árbitros con esos criterios.")
                  : (t.website.noArbitratorsYet || "Próximamente se publicará la nómina de árbitros.")}
              </p>
            </div>
          ) : (
            <>
              {/* Contador */}
              <div className="max-w-5xl mx-auto mb-6">
                <p className="text-sm text-slate-600">
                  {t.website.showingArbitrators?.replace("{count}", totalArbitrators.toString()) ||
                   `Mostrando ${totalArbitrators} árbitro${totalArbitrators !== 1 ? "s" : ""}`}
                </p>
              </div>

              {/* Grid de Árbitros */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
                {arbitrators.map((arbitrator) => (
                  <Card key={arbitrator.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-4 border-2 border-[#D66829]/20">
                          <AvatarImage src={arbitrator.image || undefined} alt={arbitrator.name} />
                          <AvatarFallback className="bg-gradient-to-br from-[#0B2A5B] to-[#D66829] text-white text-lg font-bold">
                            {getInitials(arbitrator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-slate-900 mb-1">{arbitrator.name}</h3>
                        {arbitrator.barAssociation && (
                          <p className="text-xs text-slate-500 mb-3">{arbitrator.barAssociation}</p>
                        )}

                        {/* Especialidades */}
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {arbitrator.specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {getSpecializationLabel(spec)}
                            </Badge>
                          ))}
                          {arbitrator.specializations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{arbitrator.specializations.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Estadísticas */}
                        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 border-t pt-3 w-full">
                          {arbitrator.casesCompleted > 0 && (
                            <div className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              <span>{arbitrator.casesCompleted} {t.website.casesResolved || "casos"}</span>
                            </div>
                          )}
                          {arbitrator.acceptsEmergency && (
                            <div className="flex items-center gap-1 text-[#D66829]">
                              <Zap className="h-3 w-3" />
                              <span>{t.website.emergency || "Emergencia"}</span>
                            </div>
                          )}
                        </div>
                        {arbitrator.memberSince && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                            <Calendar className="h-3 w-3" />
                            <span>{t.website.memberSince || "Miembro desde"} {formatMemberSince(arbitrator.memberSince)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t.website.previous || "Anterior"}
                  </Button>
                  <span className="text-sm text-slate-600">
                    {t.website.pageOf?.replace("{current}", currentPage.toString()).replace("{total}", totalPages.toString()) ||
                     `Página ${currentPage} de ${totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t.website.next || "Siguiente"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-[8vh] md:py-[10vh]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t.website.requirementsToJoin}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.website.requirementsSubtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {requisitos.map((req, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {(t.website as any)[req.titleKey]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {req.items.map((itemKey, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle className="h-4 w-4 text-[#D66829] shrink-0 mt-0.5" />
                        {(t.website as any)[itemKey]}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {t.website.requiredSpecialties}
              </h2>
              <p className="text-slate-600">{t.website.specialtiesSubtitle}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {specialties.map((spec, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border"
                >
                  <Scale className="h-4 w-4 text-[#D66829] shrink-0" />
                  <span className="text-sm text-slate-700">
                    {(t.website as any)[spec.labelKey]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Documentos */}
      <section className="py-[8vh]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#0B2A5B] to-[#0d3a7a] text-white">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t.website.requiredDocuments}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {t.website.documentsSubtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-3 md:grid-cols-2">
                  {documentos.map((docKey, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-[#D66829] shrink-0 mt-0.5" />
                      <span className="text-slate-700">{(t.website as any)[docKey]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-[8vh] bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {t.website.evaluationProcess}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              {[
                { step: 1, titleKey: "evalStep1", descKey: "evalStep1Desc" },
                { step: 2, titleKey: "evalStep2", descKey: "evalStep2Desc" },
                { step: 3, titleKey: "evalStep3", descKey: "evalStep3Desc" },
                { step: 4, titleKey: "evalStep4", descKey: "evalStep4Desc" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#D66829] to-[#c45a22] flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {(t.website as any)[item.titleKey]}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {(t.website as any)[item.descKey]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[8vh] bg-gradient-to-br from-[#D66829] to-[#c45a22]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.website.interestedInJoining}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {t.website.sendFileToSecretary}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-[#D66829] hover:bg-slate-100"
                onClick={() => setShowForm(true)}
              >
                <Send className="mr-2 h-5 w-5" />
                {t.website.sendFile}
              </Button>
              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t.website.moreInfo}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
