"use client";

/**
 * CAARD - Cliente de Gestión del Equipo
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UsersRound,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Mail,
  Phone,
  Linkedin,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMember {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  category?: string;
}

interface TeamSection {
  id: string;
  title: string | null;
  subtitle?: string | null;
  content: any;
  isVisible: boolean;
}

interface PageWithTeam {
  id: string;
  title: string;
  slug: string;
  sections: TeamSection[];
}

interface TeamManagementClientProps {
  pagesWithTeam: PageWithTeam[];
}

const CATEGORIES = [
  { value: "directivo", label: "Directivos" },
  { value: "arbitro", label: "Árbitros" },
  { value: "administrativo", label: "Personal Administrativo" },
  { value: "legal", label: "Equipo Legal" },
  { value: "soporte", label: "Soporte" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamManagementClient({ pagesWithTeam }: TeamManagementClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<{
    pageId: string;
    sectionId: string;
    memberIndex: number;
    member: TeamMember;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    pageId: string;
    sectionId: string;
  } | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState<TeamMember>({
    name: "",
    role: "",
    image: "",
    bio: "",
    email: "",
    phone: "",
    linkedin: "",
    category: "directivo",
  });

  const handleEdit = (
    pageId: string,
    sectionId: string,
    memberIndex: number,
    member: TeamMember
  ) => {
    setEditingMember({ pageId, sectionId, memberIndex, member });
    setFormData({ ...member, category: member.category || "directivo" });
    setIsAddingNew(false);
  };

  const handleAddNew = (pageId: string, sectionId: string) => {
    setSelectedSection({ pageId, sectionId });
    setFormData({
      name: "",
      role: "",
      image: "",
      bio: "",
      email: "",
      phone: "",
      linkedin: "",
      category: "directivo",
    });
    setIsAddingNew(true);
    setEditingMember(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetSection = isAddingNew ? selectedSection : editingMember;
      if (!targetSection) return;

      // Get the page and section
      const page = pagesWithTeam.find((p) => p.id === targetSection.pageId);
      const section = page?.sections.find((s) => s.id === targetSection.sectionId);
      if (!section) return;

      // Get current members
      const content = section.content || {};
      const members: TeamMember[] = content.members || [];

      if (isAddingNew) {
        // Add new member
        members.push(formData);
      } else if (editingMember) {
        // Update existing member
        members[editingMember.memberIndex] = formData;
      }

      // Update the section
      const response = await fetch(`/api/cms/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, members },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      router.refresh();
      setEditingMember(null);
      setIsAddingNew(false);
      setSelectedSection(null);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    pageId: string,
    sectionId: string,
    memberIndex: number
  ) => {
    setSaving(true);
    try {
      const page = pagesWithTeam.find((p) => p.id === pageId);
      const section = page?.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const content = section.content || {};
      const members: TeamMember[] = [...(content.members || [])];
      members.splice(memberIndex, 1);

      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, members },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el miembro");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (sectionId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVisible: !currentVisibility,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar visibilidad");
      }

      router.refresh();
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <UsersRound className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Equipo del Centro
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los miembros del equipo que aparecen en el sitio web
            </p>
          </div>
        </div>
      </div>

      {pagesWithTeam.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay secciones de equipo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes agregar una sección de tipo "Equipo" a alguna página del CMS.
            </p>
            <Link href="/admin/cms/pages">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ir a Páginas
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pagesWithTeam.map((page) => (
            <div key={page.id}>
              {page.sections.map((section) => {
                const content = section.content || {};
                const members: TeamMember[] = content.members || [];

                return (
                  <Card key={section.id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.title || "Sección de Equipo"}
                            <Badge variant="outline" className="text-xs">
                              /{page.slug}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {section.subtitle || `${members.length} miembros`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVisibility(section.id, section.isVisible)}
                          >
                            {section.isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/${page.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleAddNew(page.id, section.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Agregar Miembro del Equipo</DialogTitle>
                                <DialogDescription>
                                  Completa la información del nuevo miembro
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Nombre completo *</Label>
                                    <Input
                                      value={formData.name}
                                      onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                      }
                                      placeholder="Dr. Juan Pérez"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Cargo *</Label>
                                    <Input
                                      value={formData.role}
                                      onChange={(e) =>
                                        setFormData({ ...formData, role: e.target.value })
                                      }
                                      placeholder="Director General"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Categoría</Label>
                                  <Select
                                    value={formData.category}
                                    onValueChange={(v) =>
                                      setFormData({ ...formData, category: v })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                          {cat.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>URL de imagen</Label>
                                  <Input
                                    value={formData.image}
                                    onChange={(e) =>
                                      setFormData({ ...formData, image: e.target.value })
                                    }
                                    placeholder="https://..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Biografía</Label>
                                  <Textarea
                                    value={formData.bio}
                                    onChange={(e) =>
                                      setFormData({ ...formData, bio: e.target.value })
                                    }
                                    placeholder="Breve descripción..."
                                    rows={3}
                                  />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                  <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                      }
                                      placeholder="email@ejemplo.com"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                      value={formData.phone}
                                      onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                      }
                                      placeholder="+51 999 999 999"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>LinkedIn</Label>
                                    <Input
                                      value={formData.linkedin}
                                      onChange={(e) =>
                                        setFormData({ ...formData, linkedin: e.target.value })
                                      }
                                      placeholder="URL de LinkedIn"
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleSave}
                                  disabled={saving || !formData.name || !formData.role}
                                >
                                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  Guardar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {members.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <UsersRound className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay miembros en esta sección</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {members.map((member, index) => (
                            <Card key={index} className="relative group">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={member.image} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(member.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{member.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {member.role}
                                    </p>
                                    {member.category && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {CATEGORIES.find((c) => c.value === member.category)?.label ||
                                          member.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {member.bio && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {member.bio}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-3">
                                  {member.email && (
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {member.phone && (
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {member.linkedin && (
                                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleEdit(page.id, section.id, index, member)
                                        }
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>Editar Miembro</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                          <div className="space-y-2">
                                            <Label>Nombre completo *</Label>
                                            <Input
                                              value={formData.name}
                                              onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Cargo *</Label>
                                            <Input
                                              value={formData.role}
                                              onChange={(e) =>
                                                setFormData({ ...formData, role: e.target.value })
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Categoría</Label>
                                          <Select
                                            value={formData.category}
                                            onValueChange={(v) =>
                                              setFormData({ ...formData, category: v })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                  {cat.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>URL de imagen</Label>
                                          <Input
                                            value={formData.image}
                                            onChange={(e) =>
                                              setFormData({ ...formData, image: e.target.value })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Biografía</Label>
                                          <Textarea
                                            value={formData.bio}
                                            onChange={(e) =>
                                              setFormData({ ...formData, bio: e.target.value })
                                            }
                                            rows={3}
                                          />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                          <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                              type="email"
                                              value={formData.email}
                                              onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Teléfono</Label>
                                            <Input
                                              value={formData.phone}
                                              onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>LinkedIn</Label>
                                            <Input
                                              value={formData.linkedin}
                                              onChange={(e) =>
                                                setFormData({ ...formData, linkedin: e.target.value })
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          onClick={handleSave}
                                          disabled={saving || !formData.name || !formData.role}
                                        >
                                          {saving && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          )}
                                          Guardar
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará a {member.name} del equipo.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDelete(page.id, section.id, index)
                                          }
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
