"use client";

/**
 * CAARD - Cliente de Gestión de FAQs
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  GripVertical,
  MessageCircle,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

interface FAQSection {
  id: string;
  title: string | null;
  subtitle?: string | null;
  content: any;
  isVisible: boolean;
}

interface PageWithFAQs {
  id: string;
  title: string;
  slug: string;
  sections: FAQSection[];
}

interface FAQsManagementClientProps {
  pagesWithFAQs: PageWithFAQs[];
}

export function FAQsManagementClient({
  pagesWithFAQs,
}: FAQsManagementClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<{
    pageId: string;
    sectionId: string;
    faqIndex: number;
    faq: FAQ;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    pageId: string;
    sectionId: string;
  } | null>(null);

  const [formData, setFormData] = useState<FAQ>({
    question: "",
    answer: "",
    category: "",
  });

  const handleEdit = (
    pageId: string,
    sectionId: string,
    faqIndex: number,
    faq: FAQ
  ) => {
    setEditingFAQ({ pageId, sectionId, faqIndex, faq });
    setFormData({ ...faq });
    setIsAddingNew(false);
  };

  const handleAddNew = (pageId: string, sectionId: string) => {
    setSelectedSection({ pageId, sectionId });
    setFormData({
      question: "",
      answer: "",
      category: "",
    });
    setIsAddingNew(true);
    setEditingFAQ(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetSection = isAddingNew ? selectedSection : editingFAQ;
      if (!targetSection) return;

      const page = pagesWithFAQs.find((p) => p.id === targetSection.pageId);
      const section = page?.sections.find((s) => s.id === targetSection.sectionId);
      if (!section) return;

      const content = section.content || {};
      const items: FAQ[] = content.items || [];

      if (isAddingNew) {
        items.push({ ...formData, order: items.length });
      } else if (editingFAQ) {
        items[editingFAQ.faqIndex] = formData;
      }

      const response = await fetch(`/api/cms/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, items },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      router.refresh();
      setEditingFAQ(null);
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
    faqIndex: number
  ) => {
    setSaving(true);
    try {
      const page = pagesWithFAQs.find((p) => p.id === pageId);
      const section = page?.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const content = section.content || {};
      const items: FAQ[] = [...(content.items || [])];
      items.splice(faqIndex, 1);

      const response = await fetch(`/api/cms/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { ...content, items },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar la pregunta");
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

  const FAQForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Pregunta *</Label>
        <Input
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="¿Qué es el arbitraje?"
        />
      </div>

      <div className="space-y-2">
        <Label>Respuesta *</Label>
        <Textarea
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          placeholder="El arbitraje es un método alternativo de resolución de conflictos..."
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label>Categoría (opcional)</Label>
        <Input
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="General, Proceso, Costos, etc."
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">
              Preguntas Frecuentes
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las preguntas frecuentes del sitio web
            </p>
          </div>
        </div>
      </div>

      {pagesWithFAQs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No hay secciones de preguntas frecuentes
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero debes agregar una sección de tipo "Acordeón" a alguna
              página del CMS.
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
          {pagesWithFAQs.map((page) => (
            <div key={page.id}>
              {page.sections.map((section) => {
                const content = section.content || {};
                const items: FAQ[] = content.items || [];

                return (
                  <Card key={section.id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.title || "Preguntas Frecuentes"}
                            <Badge variant="outline" className="text-xs">
                              /{page.slug}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {section.subtitle || `${items.length} preguntas`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleVisibility(section.id, section.isVisible)
                            }
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
                                <DialogTitle>Agregar Pregunta</DialogTitle>
                                <DialogDescription>
                                  Completa la información de la nueva pregunta
                                  frecuente
                                </DialogDescription>
                              </DialogHeader>
                              <FAQForm />
                              <DialogFooter>
                                <Button
                                  onClick={handleSave}
                                  disabled={
                                    saving ||
                                    !formData.question ||
                                    !formData.answer
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
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay preguntas frecuentes en esta sección</p>
                        </div>
                      ) : (
                        <Accordion type="single" collapsible className="w-full">
                          {items.map((faq, index) => (
                            <AccordionItem
                              key={index}
                              value={`faq-${index}`}
                              className="group"
                            >
                              <div className="flex items-start">
                                <AccordionTrigger className="flex-1 text-left hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {faq.question}
                                    </span>
                                    {faq.category && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] shrink-0"
                                      >
                                        {faq.category}
                                      </Badge>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-4">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleEdit(
                                            page.id,
                                            section.id,
                                            index,
                                            faq
                                          )
                                        }
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Editar Pregunta
                                        </DialogTitle>
                                      </DialogHeader>
                                      <FAQForm />
                                      <DialogFooter>
                                        <Button
                                          onClick={handleSave}
                                          disabled={
                                            saving ||
                                            !formData.question ||
                                            !formData.answer
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
                                          ¿Eliminar pregunta?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará la pregunta "
                                          {faq.question.slice(0, 50)}..."
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDelete(
                                              page.id,
                                              section.id,
                                              index
                                            )
                                          }
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              <AccordionContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {faq.answer}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
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
