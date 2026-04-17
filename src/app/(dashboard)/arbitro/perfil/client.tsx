"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Save,
  Upload,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  PenTool,
  CheckCircle2,
  AlertCircle,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Shield,
  Link as LinkIcon,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  slug: string;
  displayName: string;
  title: string | null;
  photoUrl: string | null;
  biography: string | null;
  contactEmail: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  colegiatura: string | null;
  colegio: string | null;
  rnaNumber: string | null;
  especialidad: string | null;
  specializations: string[];
  yearsExperience: number | null;
  affiliatedCenters: any;
  education: any;
  experience: any;
  publications: any;
  languages: any;
  cvDocumentUrl: string | null;
  rnaDocumentUrl: string | null;
  contraloriaDocumentUrl: string | null;
  otherDocuments: any;
  availableForCases: boolean;
  availabilityNotes: string | null;
  independenceDeclaration: string | null;
  independenceSignedAt: string | null;
  independenceSignatureUrl: string | null;
  processesHistory: any;
  isPublished: boolean;
}

const DECLARACION_INDEPENDENCIA_DEFAULT = `Declaro bajo juramento lo siguiente:
1. Que mantengo independencia de las partes y del proceso arbitral que me ha sido encomendado.
2. Que no tengo relación personal, profesional o económica que pueda afectar mi imparcialidad.
3. Que no he prestado servicios legales a ninguna de las partes en los últimos cinco (5) años.
4. Que revelaré de inmediato cualquier circunstancia sobreviniente que pudiera comprometer mi independencia.
5. Que cumpliré con las normas de ética arbitral aplicables y el Reglamento de CAARD.`;

export function PerfilArbitroClient({ userEmail }: { userEmail: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/arbitrators/profile");
      if (r.ok) {
        const d = await r.json();
        setProfile(d.profile);
      } else {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Error al cargar perfil");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (key: keyof Profile, value: any) => {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const r = await fetch("/api/arbitrators/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Error al guardar");
      }
      setOk("Perfil guardado correctamente");
      setTimeout(() => setOk(null), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Cargando...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p>{error || "No se pudo cargar el perfil"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#D66829]">Mi perfil de árbitro</h1>
          <p className="text-sm text-muted-foreground">
            URL pública:{" "}
            <Link
              href={`/arbitros/${profile.slug}`}
              target="_blank"
              className="text-[#D66829] hover:underline"
            >
              /arbitros/{profile.slug}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={profile.isPublished}
              onCheckedChange={(v) => updateField("isPublished", v)}
            />
            <Label className="text-sm">{profile.isPublished ? "Publicado" : "Borrador"}</Label>
          </div>
          <Button onClick={save} disabled={saving} className="bg-[#D66829] hover:bg-[#c45a22]">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</div>}
      {ok && <div className="rounded bg-green-50 border border-green-200 text-green-700 p-3 text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{ok}</div>}

      <Tabs defaultValue="datos" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="datos"><User className="h-4 w-4 mr-1" />Datos</TabsTrigger>
          <TabsTrigger value="carrera"><Briefcase className="h-4 w-4 mr-1" />Carrera</TabsTrigger>
          <TabsTrigger value="estudios"><GraduationCap className="h-4 w-4 mr-1" />Estudios</TabsTrigger>
          <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1" />Documentos</TabsTrigger>
          <TabsTrigger value="procesos"><Award className="h-4 w-4 mr-1" />Procesos</TabsTrigger>
          <TabsTrigger value="independencia"><Shield className="h-4 w-4 mr-1" />Independencia</TabsTrigger>
        </TabsList>

        {/* DATOS PERSONALES */}
        <TabsContent value="datos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Información básica</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nombre para mostrar *</Label>
                  <Input value={profile.displayName} onChange={(e) => updateField("displayName", e.target.value)} />
                </div>
                <div><Label>Título profesional</Label>
                  <Input value={profile.title || ""} onChange={(e) => updateField("title", e.target.value)} placeholder="Ej: Árbitro Especialista en Derecho Comercial" />
                </div>
                <div><Label>Email de contacto</Label>
                  <Input type="email" value={profile.contactEmail || userEmail} onChange={(e) => updateField("contactEmail", e.target.value)} />
                </div>
                <div><Label>Teléfono</Label>
                  <Input value={profile.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="+51 ..." />
                </div>
                <div className="md:col-span-2"><Label>LinkedIn</Label>
                  <Input value={profile.linkedinUrl || ""} onChange={(e) => updateField("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div><Label>Foto (URL)</Label>
                  <Input value={profile.photoUrl || ""} onChange={(e) => updateField("photoUrl", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Biografía</Label>
                <Textarea rows={5} value={profile.biography || ""} onChange={(e) => updateField("biography", e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Disponible para asumir nuevos procesos</Label>
                  <p className="text-xs text-muted-foreground">Si desactivas, no apareces en listados de árbitros asignables.</p>
                </div>
                <Switch checked={profile.availableForCases} onCheckedChange={(v) => updateField("availableForCases", v)} />
              </div>
              <div>
                <Label>Notas sobre disponibilidad</Label>
                <Textarea rows={2} value={profile.availabilityNotes || ""} onChange={(e) => updateField("availabilityNotes", e.target.value)} placeholder="Ej: disponible a partir del 1 de junio..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CARRERA */}
        <TabsContent value="carrera" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Datos profesionales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Colegio profesional</Label>
                  <Input value={profile.colegio || ""} onChange={(e) => updateField("colegio", e.target.value)} placeholder="Ej: Colegio de Abogados de Lima" />
                </div>
                <div><Label>N° Colegiatura</Label>
                  <Input value={profile.colegiatura || ""} onChange={(e) => updateField("colegiatura", e.target.value)} placeholder="CAL 12345" />
                </div>
                <div><Label>N° RNA (Registro Nacional de Árbitros)</Label>
                  <Input value={profile.rnaNumber || ""} onChange={(e) => updateField("rnaNumber", e.target.value)} />
                </div>
                <div><Label>Años de experiencia</Label>
                  <Input type="number" min={0} value={profile.yearsExperience ?? ""} onChange={(e) => updateField("yearsExperience", e.target.value ? parseInt(e.target.value) : null)} />
                </div>
                <div className="md:col-span-2"><Label>Especialidad principal</Label>
                  <Input value={profile.especialidad || ""} onChange={(e) => updateField("especialidad", e.target.value)} placeholder="Ej: Arbitraje comercial internacional" />
                </div>
                <div className="md:col-span-2">
                  <Label>Áreas de especialización (separadas por coma)</Label>
                  <Input
                    value={(profile.specializations || []).join(", ")}
                    onChange={(e) => updateField("specializations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="Arbitraje, Contratos, Construcción..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ArrayEditor
            title="Centros a los que pertenece"
            description="Nómina histórica de centros arbitrales donde es o ha sido árbitro"
            value={profile.affiliatedCenters}
            onChange={(v) => updateField("affiliatedCenters", v)}
            fields={[
              { key: "name", label: "Centro", required: true },
              { key: "role", label: "Rol/tipo", placeholder: "Árbitro, miembro del consejo..." },
              { key: "since", label: "Desde", placeholder: "2020" },
              { key: "url", label: "URL" },
            ]}
          />

          <ArrayEditor
            title="Experiencia profesional"
            value={profile.experience}
            onChange={(v) => updateField("experience", v)}
            fields={[
              { key: "position", label: "Cargo", required: true },
              { key: "organization", label: "Organización", required: true },
              { key: "period", label: "Período", placeholder: "2018 - 2022" },
            ]}
          />

          <ArrayEditor
            title="Publicaciones"
            value={profile.publications}
            onChange={(v) => updateField("publications", v)}
            fields={[
              { key: "title", label: "Título", required: true },
              { key: "publisher", label: "Editorial / Revista" },
              { key: "year", label: "Año" },
              { key: "url", label: "URL" },
            ]}
          />

          <ArrayEditor
            title="Idiomas"
            value={profile.languages}
            onChange={(v) => updateField("languages", v)}
            fields={[
              { key: "language", label: "Idioma", required: true },
              { key: "level", label: "Nivel", placeholder: "Nativo / Avanzado..." },
            ]}
          />
        </TabsContent>

        {/* ESTUDIOS */}
        <TabsContent value="estudios" className="space-y-4">
          <ArrayEditor
            title="Formación académica"
            description="Títulos, grados, maestrías, especializaciones"
            value={profile.education}
            onChange={(v) => updateField("education", v)}
            fields={[
              { key: "degree", label: "Grado / Título", required: true },
              { key: "institution", label: "Institución", required: true },
              { key: "year", label: "Año" },
              { key: "documentUrl", label: "URL del documento (opcional)" },
            ]}
          />
        </TabsContent>

        {/* DOCUMENTOS */}
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del árbitro</CardTitle>
              <CardDescription>
                Sube tu CV, registro RNA, declaración jurada de contraloría (firmada) y otros documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUpload
                label="Curriculum Vitae (CV)"
                kind="cv"
                currentUrl={profile.cvDocumentUrl}
                onUploaded={(url) => updateField("cvDocumentUrl", url)}
              />
              <DocumentUpload
                label="Registro RNA"
                kind="rna"
                description="Registro Nacional de Árbitros si aplica"
                currentUrl={profile.rnaDocumentUrl}
                onUploaded={(url) => updateField("rnaDocumentUrl", url)}
              />
              <DocumentUpload
                label="Declaración Jurada de Contraloría"
                kind="contraloria"
                description={
                  <>
                    Genera tu DJ en{" "}
                    <a
                      href="https://appdji.contraloria.gob.pe/djic/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D66829] hover:underline font-medium"
                    >
                      appdji.contraloria.gob.pe/djic/
                    </a>{" "}
                    y sube el PDF firmado digitalmente.
                  </>
                }
                currentUrl={profile.contraloriaDocumentUrl}
                onUploaded={(url) => updateField("contraloriaDocumentUrl", url)}
              />
              <OtherDocsList
                documents={profile.otherDocuments || []}
                onAdd={(doc) =>
                  updateField("otherDocuments", [...(profile.otherDocuments || []), doc])
                }
                onRemove={(idx) =>
                  updateField(
                    "otherDocuments",
                    (profile.otherDocuments || []).filter((_: any, i: number) => i !== idx)
                  )
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROCESOS */}
        <TabsContent value="procesos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Procesos de los últimos 5 años</CardTitle>
              <CardDescription>
                Liste los procesos arbitrales en los que participa/participó. Para procesos de CAARD
                se jala automáticamente la información; para procesos externos ingréselos manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessesEditor
                value={profile.processesHistory}
                onChange={(v) => updateField("processesHistory", v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* INDEPENDENCIA */}
        <TabsContent value="independencia" className="space-y-4">
          <IndependenceDeclaration
            declaration={profile.independenceDeclaration}
            signedAt={profile.independenceSignedAt}
            signatureUrl={profile.independenceSignatureUrl}
            onSigned={() => load()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========= SUB COMPONENTS =========

function DocumentUpload({
  label,
  kind,
  description,
  currentUrl,
  onUploaded,
}: {
  label: string;
  kind: string;
  description?: React.ReactNode;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const r = await fetch("/api/arbitrators/profile/document", {
        method: "POST",
        body: fd,
      });
      if (r.ok) {
        const d = await r.json();
        onUploaded(d.url);
      } else {
        const d = await r.json().catch(() => ({}));
        alert(d.error || "Error al subir");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-medium">{label}</p>
          {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
        </div>
        <div className="flex gap-2">
          {currentUrl && (
            <Button size="sm" variant="outline" onClick={() => window.open(currentUrl, "_blank")}>
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.png"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-[#D66829] hover:bg-[#c45a22]"
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            {currentUrl ? "Reemplazar" : "Subir"}
          </Button>
        </div>
      </div>
      {currentUrl && (
        <Badge variant="secondary" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Documento cargado
        </Badge>
      )}
    </div>
  );
}

function OtherDocsList({
  documents,
  onAdd,
  onRemove,
}: {
  documents: any[];
  onAdd: (doc: any) => void;
  onRemove: (idx: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const docLabel = label || file.name;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "other");
      fd.append("label", docLabel);
      const r = await fetch("/api/arbitrators/profile/document", {
        method: "POST",
        body: fd,
      });
      if (r.ok) {
        const d = await r.json();
        onAdd({ name: docLabel, url: d.url, uploadedAt: new Date().toISOString() });
        setLabel("");
      } else {
        const d = await r.json().catch(() => ({}));
        alert(d.error || "Error al subir");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <p className="font-medium">Otros documentos</p>
        <p className="text-xs text-muted-foreground">Certificados, constancias, publicaciones, etc.</p>
      </div>
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((d, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded text-sm"
            >
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 truncate hover:underline flex-1"
              >
                <FileText className="h-4 w-4" />
                <span className="truncate">{d.name}</span>
              </a>
              <Button size="sm" variant="ghost" onClick={() => onRemove(i)}>
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Etiqueta (opcional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          variant="outline"
        >
          {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
          Subir
        </Button>
      </div>
    </div>
  );
}

function ArrayEditor({
  title,
  description,
  value,
  onChange,
  fields,
}: {
  title: string;
  description?: string;
  value: any;
  onChange: (v: any[]) => void;
  fields: { key: string; label: string; required?: boolean; placeholder?: string }[];
}) {
  const list: any[] = Array.isArray(value) ? value : [];

  const add = () => {
    const item: any = {};
    for (const f of fields) item[f.key] = "";
    onChange([...list, item]);
  };

  const update = (idx: number, key: string, val: string) => {
    const next = [...list];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Sin entradas</p>
        )}
        {list.map((item, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/20">
            <div className="grid md:grid-cols-2 gap-2">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </Label>
                  <Input
                    value={item[f.key] || ""}
                    onChange={(e) => update(i, f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(i)} className="text-red-600">
              <Trash2 className="h-3 w-3 mr-1" />
              Quitar
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </CardContent>
    </Card>
  );
}

function ProcessesEditor({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any[]) => void;
}) {
  const list: any[] = Array.isArray(value) ? value : [];

  const add = () => {
    onChange([
      ...list,
      {
        expedienteNumber: "",
        centerName: "",
        rol: "ARBITRO_UNICO",
        type: "INSTITUCIONAL",
        status: "VIGENTE",
        startDate: "",
        claimantName: "",
        respondentName: "",
        isCaardCase: false,
      },
    ]);
  };

  const update = (idx: number, key: string, val: any) => {
    const next = [...list];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Sin procesos registrados</p>
      )}
      {list.map((p, i) => (
        <div key={i} className="rounded-lg border p-3 bg-muted/20 space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">N° Expediente</Label>
              <Input value={p.expedienteNumber || ""} onChange={(e) => update(i, "expedienteNumber", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Centro / Institución</Label>
              <Input value={p.centerName || ""} onChange={(e) => update(i, "centerName", e.target.value)} placeholder="CAARD, OSCE, CCL..." />
            </div>
            <div>
              <Label className="text-xs">Rol</Label>
              <Select value={p.rol || "ARBITRO_UNICO"} onValueChange={(v) => update(i, "rol", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARBITRO_UNICO">Árbitro único</SelectItem>
                  <SelectItem value="PRESIDENTE">Árbitro presidente</SelectItem>
                  <SelectItem value="COARBITRO">Coárbitro</SelectItem>
                  <SelectItem value="ABOGADO_PARTE">Abogado de parte</SelectItem>
                  <SelectItem value="PROCURADOR">Procurador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={p.type || "INSTITUCIONAL"} onValueChange={(v) => update(i, "type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTITUCIONAL">Institucional</SelectItem>
                  <SelectItem value="AD_HOC">Ad-hoc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Select value={p.status || "VIGENTE"} onValueChange={(v) => update(i, "status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="LAUDADO">Laudado</SelectItem>
                  <SelectItem value="ARCHIVADO">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fecha de inicio</Label>
              <Input type="date" value={p.startDate || ""} onChange={(e) => update(i, "startDate", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Demandante</Label>
              <Input value={p.claimantName || ""} onChange={(e) => update(i, "claimantName", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Demandado</Label>
              <Input value={p.respondentName || ""} onChange={(e) => update(i, "respondentName", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Abogados / Procuradores</Label>
              <Input value={p.lawyers || ""} onChange={(e) => update(i, "lawyers", e.target.value)} placeholder="Separados por coma" />
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => remove(i)} className="text-red-600">
            <Trash2 className="h-3 w-3 mr-1" />
            Quitar proceso
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={add}>
        <Plus className="h-4 w-4 mr-1" />
        Agregar proceso
      </Button>
    </div>
  );
}

function IndependenceDeclaration({
  declaration,
  signedAt,
  signatureUrl,
  onSigned,
}: {
  declaration: string | null;
  signedAt: string | null;
  signatureUrl: string | null;
  onSigned: () => void;
}) {
  const [text, setText] = useState(declaration || DECLARACION_INDEPENDENCIA_DEFAULT);
  const [showSign, setShowSign] = useState(false);
  const [saving, setSaving] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);

  const sign = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("Dibuja tu firma en el recuadro");
      return;
    }
    setSaving(true);
    try {
      const signatureDataUrl = sigRef.current.toDataURL("image/png");
      const r = await fetch("/api/arbitrators/profile/sign-independence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ declaration: text, signatureDataUrl }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Error al firmar");
      }
      setShowSign(false);
      onSigned();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Declaración de independencia e imparcialidad</CardTitle>
        <CardDescription>
          Lea el texto, edítelo si lo desea y fírmelo digitalmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signedAt && signatureUrl ? (
          <div className="space-y-3">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Firmado el {new Date(signedAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}
            </Badge>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Texto firmado:</p>
              <pre className="whitespace-pre-wrap text-sm">{declaration}</pre>
            </div>
            <div className="bg-white border rounded-lg p-4 inline-block">
              <p className="text-xs text-muted-foreground mb-2">Firma:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureUrl} alt="firma" className="max-h-24" />
            </div>
            <Button variant="outline" onClick={() => setShowSign(true)}>
              <PenTool className="h-4 w-4 mr-2" />
              Re-firmar
            </Button>
          </div>
        ) : (
          <>
            <Textarea
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={() => setShowSign(true)} className="bg-[#D66829] hover:bg-[#c45a22]">
              <PenTool className="h-4 w-4 mr-2" />
              Firmar declaración
            </Button>
          </>
        )}
      </CardContent>

      <Dialog open={showSign} onOpenChange={setShowSign}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma digital</DialogTitle>
            <DialogDescription>Dibuje su firma en el recuadro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="border-2 border-dashed rounded-lg bg-white">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{ width: 500, height: 200, className: "w-full rounded-lg" }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => sigRef.current?.clear()}>
              Limpiar firma
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSign(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={sign} disabled={saving} className="bg-[#D66829] hover:bg-[#c45a22]">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
              Firmar y guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
