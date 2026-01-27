"use client";

/**
 * CAARD - Cliente de Gestión de Testimonios
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Quote,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  quote: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
  authorImage?: string;
  rating?: number;
}

interface TestimonialSection {
  id: string;
  title: string | null;
  subtitle?: string | null;
  content: any;
  isVisible: boolean;
}

interface PageWithTestimonials {
  id: string;
  title: string;
  slug: string;
  sections: TestimonialSection[];
}

interface TestimonialsManagementClientProps {
  pagesWithTestimonials: PageWithTestimonials[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({
  rating,
  onChange,
  interactive = false,
}: {
  rating: number;
  onChange?: (rating: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
          onClick={() => interactive && onChange?.(star)}
        />
      ))}
    </div>
  );
}

export function TestimonialsManagementClient({
  pagesWithTestimonials,
}: TestimonialsManagementClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<{
    pageId: string;
    sectionId: string;
    testimonialIndex: number;
    testimonial: Testimonial;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    pageId: string;
    sectionId: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Testimonial>({
    quote: "",
    authorName: "",
    authorRole: "",
    authorCompany: "",
    authorImage: "",
    rating: 5,
  });

  const handleEdit = (
    pageId: string,
    sectionId: string,
    testimonialIndex: number,
    testimonial: Testimonial
  ) => {
    setEditingTestimonial({ pageId, sectionId, testimonialIndex, testimonial });
    setFormData({ ...testimonial, rating: testimonial.rating || 5 });
    setIsAddingNew(false);
  };

  const handleAddNew = (pageId: string, sectionId: string) => {
    setSelectedSection({ pageId, sectionId });
    setFormData({
      quote: "",
      authorName: "",
      authorRole: "",
      authorCompany: "",
      authorImage: "",
      rating: 5,
    });
    setIsAddingNew(true);
    setEditingTestimonial(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetSection = isAddingNew ? selectedSection : editingTestimonial;
      if (!targetSection) return;

      // Get the page and section
      const page = pagesWithTestimonials.find((p) => p.id === targetSection.pageId);
      const section = page?.sections.find((s) => s.id === targetSection.sectionId);
      if (!section) return;

      // Get current testimonials
      const content = section.content || {};
      const testimonials: Testimonial[] = content.testimonials || [];

      if (isAddingNew) {
        // Add new testimonial
        testimonials.push(formData);
      } else if (editingTestimonial) {
        // Update existing testimonial
        testimonials[editingTestimonial.testimonialIndex] = formData;
      }

      // Update the section
      const response = await fetch(`/api/cms/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, testimonials },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      router.refresh();
      setEditingTestimonial(null);
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
    testimonialIndex: number
  ) => {
    setSaving(true);
    try {
      const page = pagesWithTestimonials.find((p) => p.id === pageId);
      const section = page?.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const content = section.content || {};
      const testimonials: Testimonial[] = [...(content.testimonials || [])];
      testimonials.splice(testimonialIndex, 1);

      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, testimonials },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el testimonio");
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
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Quote className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Testimonios
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los testimonios que aparecen en el sitio web
            </p>
          </div>
        </div>
      </div>

      {pagesWithTestimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Quote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay secciones de testimonios</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes agregar una sección de tipo "Testimonios" a alguna página del CMS.
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
          {pagesWithTestimonials.map((page) => (
            <div key={page.id}>
              {page.sections.map((section) => {
                const content = section.content || {};
                const testimonials: Testimonial[] = content.testimonials || [];

                return (
                  <Card key={section.id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.title || "Sección de Testimonios"}
                            <Badge variant="outline" className="text-xs">
                              /{page.slug}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {section.subtitle || `${testimonials.length} testimonios`}
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
                                <DialogTitle>Agregar Testimonio</DialogTitle>
                                <DialogDescription>
                                  Completa la información del nuevo testimonio
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Testimonio *</Label>
                                  <Textarea
                                    value={formData.quote}
                                    onChange={(e) =>
                                      setFormData({ ...formData, quote: e.target.value })
                                    }
                                    placeholder="Escriba el testimonio aquí..."
                                    rows={4}
                                  />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Nombre del autor *</Label>
                                    <Input
                                      value={formData.authorName}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          authorName: e.target.value,
                                        })
                                      }
                                      placeholder="Juan Pérez"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Cargo</Label>
                                    <Input
                                      value={formData.authorRole}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          authorRole: e.target.value,
                                        })
                                      }
                                      placeholder="Gerente General"
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Empresa</Label>
                                    <Input
                                      value={formData.authorCompany}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          authorCompany: e.target.value,
                                        })
                                      }
                                      placeholder="Empresa S.A.C."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>URL de imagen</Label>
                                    <Input
                                      value={formData.authorImage}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          authorImage: e.target.value,
                                        })
                                      }
                                      placeholder="https://..."
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Calificación</Label>
                                  <StarRating
                                    rating={formData.rating || 5}
                                    onChange={(rating) =>
                                      setFormData({ ...formData, rating })
                                    }
                                    interactive
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleSave}
                                  disabled={
                                    saving || !formData.quote || !formData.authorName
                                  }
                                >
                                  {saving && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  )}
                                  Guardar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {testimonials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Quote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay testimonios en esta sección</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {testimonials.map((testimonial, index) => (
                            <Card key={index} className="relative group">
                              <CardContent className="p-4">
                                <Quote className="h-6 w-6 text-amber-500/30 mb-2" />
                                <p className="text-sm italic line-clamp-3 mb-3">
                                  "{testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={testimonial.authorImage} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(testimonial.authorName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {testimonial.authorName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {[testimonial.authorRole, testimonial.authorCompany]
                                        .filter(Boolean)
                                        .join(" - ")}
                                    </p>
                                  </div>
                                </div>
                                {testimonial.rating && (
                                  <div className="mt-2">
                                    <StarRating rating={testimonial.rating} />
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleEdit(page.id, section.id, index, testimonial)
                                        }
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>Editar Testimonio</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <Label>Testimonio *</Label>
                                          <Textarea
                                            value={formData.quote}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                quote: e.target.value,
                                              })
                                            }
                                            rows={4}
                                          />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                          <div className="space-y-2">
                                            <Label>Nombre del autor *</Label>
                                            <Input
                                              value={formData.authorName}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  authorName: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Cargo</Label>
                                            <Input
                                              value={formData.authorRole}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  authorRole: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                          <div className="space-y-2">
                                            <Label>Empresa</Label>
                                            <Input
                                              value={formData.authorCompany}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  authorCompany: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>URL de imagen</Label>
                                            <Input
                                              value={formData.authorImage}
                                              onChange={(e) =>
                                                setFormData({
                                                  ...formData,
                                                  authorImage: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Calificación</Label>
                                          <StarRating
                                            rating={formData.rating || 5}
                                            onChange={(rating) =>
                                              setFormData({ ...formData, rating })
                                            }
                                            interactive
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          onClick={handleSave}
                                          disabled={
                                            saving ||
                                            !formData.quote ||
                                            !formData.authorName
                                          }
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
                                        <AlertDialogTitle>
                                          ¿Eliminar testimonio?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará el testimonio de{" "}
                                          {testimonial.authorName}.
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
