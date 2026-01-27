/**
 * Página: Ayuda y Soporte
 * ========================
 * Centro de ayuda y recursos para usuarios
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  Book,
  MessageCircle,
  FileText,
  Video,
  Phone,
  Mail,
  ExternalLink,
  Search,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const faqItems = [
  {
    question: "¿Cómo presento una solicitud de arbitraje?",
    answer: "Puede presentar su solicitud desde el menú 'Nueva Solicitud'. Complete el formulario con los datos requeridos y adjunte los documentos necesarios.",
    category: "general",
  },
  {
    question: "¿Cuánto tiempo toma un proceso de arbitraje?",
    answer: "El tiempo depende de la complejidad del caso. Un arbitraje acelerado puede tomar 3-6 meses, mientras que uno regular puede tomar 6-12 meses.",
    category: "proceso",
  },
  {
    question: "¿Cómo se calculan los costos del arbitraje?",
    answer: "Los costos se calculan según la cuantía del caso usando la tabla de tarifas vigente. Puede usar la calculadora en la sección de pagos.",
    category: "pagos",
  },
  {
    question: "¿Qué documentos necesito para iniciar un arbitraje?",
    answer: "Necesita: el convenio arbitral, poder de representación (si aplica), documentos que sustenten su pretensión, y comprobante de pago de la tasa inicial.",
    category: "documentos",
  },
  {
    question: "¿Cómo notifico un documento a la contraparte?",
    answer: "Los documentos se notifican automáticamente a través del sistema cuando los carga al expediente. La contraparte recibe una notificación por correo.",
    category: "documentos",
  },
  {
    question: "¿Qué es el arbitraje de emergencia?",
    answer: "Es un procedimiento expedito para obtener medidas cautelares urgentes antes de la constitución del tribunal arbitral, con resolución en 24-48 horas.",
    category: "proceso",
  },
];

const quickLinks = [
  { title: "Guía de Inicio Rápido", icon: Book, href: "#", description: "Aprenda los conceptos básicos" },
  { title: "Video Tutoriales", icon: Video, href: "#", description: "Tutoriales paso a paso" },
  { title: "Reglamento de Arbitraje", icon: FileText, href: "#", description: "Normativa aplicable" },
  { title: "Tabla de Tarifas", icon: FileText, href: "/admin/fees", description: "Costos y honorarios" },
];

export default function AyudaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centro de Ayuda</h1>
        <p className="text-muted-foreground">
          Encuentre respuestas y recursos para usar el sistema
        </p>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar en la ayuda..."
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enlaces Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Card key={link.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <Link href={link.href} className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preguntas Frecuentes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Preguntas Frecuentes
              </CardTitle>
              <CardDescription>
                Respuestas a las consultas más comunes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <h4 className="font-medium flex items-center justify-between">
                      {item.question}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver todas las preguntas frecuentes
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contacto */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                ¿Necesita más ayuda?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si no encontró la respuesta que buscaba, nuestro equipo de soporte
                está disponible para ayudarle.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Correo electrónico</p>
                    <p className="text-sm text-muted-foreground">soporte@caard.pe</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">+51 1 234 5678</p>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Iniciar chat de soporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horario de Atención</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Lunes a Viernes</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábados</span>
                  <span className="font-medium">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Domingos y feriados</span>
                  <span>Cerrado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asistente IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Nuestro asistente de inteligencia artificial puede ayudarle
                con consultas generales sobre el proceso arbitral.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/asistente">
                  Consultar al Asistente IA
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
