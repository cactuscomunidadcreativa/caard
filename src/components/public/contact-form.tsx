"use client";

/**
 * CAARD - Formulario de Contacto
 */

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";

export function ContactForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subjects = [
    { value: "consulta_general", label: "Consulta General" },
    { value: "solicitud_arbitraje", label: t.website.arbitrationRequest },
    { value: "consulta_proceso", label: "Consulta sobre mi Proceso" },
    { value: "servicios", label: t.website.services },
    { value: "registro_arbitros", label: t.website.arbitratorRegistry },
    { value: "facturacion", label: t.payments.title },
    { value: "otro", label: "Otro" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular envío (reemplazar con API real)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSuccess(true);

    // Reset después de mostrar éxito
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {t.success.sent}
        </h3>
        <p className="text-slate-600">
          {t.website.contactSubtitle}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t.website.name} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t.website.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.email} *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{t.website.phone}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+51 999 999 999"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">{t.website.subject} *</Label>
          <Select
            value={formData.subject}
            onValueChange={(value) => setFormData({ ...formData, subject: value })}
            required
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder={t.forms.selectOption} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.value} value={subject.value}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t.website.message} *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder={t.website.message}
          rows={5}
          required
        />
      </div>

      <div className="text-sm text-slate-500">
        {t.common.required}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#D66829] hover:bg-[#c45a22]"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t.common.loading}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {t.website.sendMessage}
          </>
        )}
      </Button>
    </form>
  );
}
