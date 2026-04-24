/**
 * CAARD CMS - Renderizador de Secciones Moderno
 * Colores: Naranja (#D66829) primario, Azul (#0B2A5B) acento
 * Diseño: Moderno, responsive, glassmorphism, gradientes
 * Full-width sections, carruseles, formularios dinámicos
 */

import Link from "next/link";
import {
  Scale,
  Briefcase,
  Building2,
  AlertTriangle,
  Shield,
  Handshake,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  Clipboard,
  Users,
  FileText,
  CreditCard,
  User,
  Download,
  ExternalLink,
  Quote,
  CheckCircle,
  ChevronDown,
  Send,
  Play,
  Star,
  Award,
  Target,
  Lightbulb,
  Heart,
  Rocket,
  Globe,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Carousel, CarouselSlide } from "./carousel";
import { CmsButton, ButtonConfig } from "./button-editor";
import { DynamicForm, FormConfig } from "./form-builder";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface CmsSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  bgColor: string | null;
  textColor: string | null;
  bgImage: string | null;
  padding: string | null;
}

interface SectionRendererProps {
  section: CmsSection;
}

// Mapeo de iconos extendido
const ICONS: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  building: Building2,
  alert: AlertTriangle,
  alertTriangle: AlertTriangle,
  shield: Shield,
  handshake: Handshake,
  scale: Scale,
  clock: Clock,
  clipboard: Clipboard,
  users: Users,
  fileText: FileText,
  creditCard: CreditCard,
  user: User,
  phone: Phone,
  mail: Mail,
  mapPin: MapPin,
  download: Download,
  externalLink: ExternalLink,
  checkCircle: CheckCircle,
  play: Play,
  star: Star,
  award: Award,
  target: Target,
  lightbulb: Lightbulb,
  heart: Heart,
  rocket: Rocket,
  globe: Globe,
  layers: Layers,
};

// Mapeo de padding - valores responsivos con clamp
const PADDING_CLASSES: Record<string, string> = {
  sm: "py-[4vh] md:py-[6vh]",
  md: "py-[6vh] md:py-[8vh]",
  lg: "py-[8vh] md:py-[10vh]",
  xl: "py-[10vh] md:py-[12vh]",
};

export function SectionRenderer({ section }: SectionRendererProps) {
  const paddingClass = PADDING_CLASSES[section.padding || "md"] || "py-16";
  const bgStyle = section.bgColor ? { backgroundColor: section.bgColor } : {};
  const textStyle = section.textColor ? { color: section.textColor } : {};

  switch (section.type) {
    case "HERO":
      return <HeroSection section={section} />;
    case "SLIDER":
    case "BANNER":
      return <SliderSection section={section} />;
    case "TEXT":
      return <TextSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "CARDS":
      return <CardsSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "FEATURE_GRID":
      return <FeatureGridSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "STATS":
      return <StatsSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "CTA":
      return <CTASection section={section} paddingClass={paddingClass} bgStyle={bgStyle} textStyle={textStyle} />;
    case "TEAM":
      return <TeamSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "ACCORDION":
      return <AccordionSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "CONTACT_FORM":
      return <ContactFormSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "DYNAMIC_FORM":
      return <DynamicFormSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "EMBED":
      return <EmbedSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "VIDEO":
      return <VideoSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "TESTIMONIALS":
      return <TestimonialsSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "TIMELINE":
      return <TimelineSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "GALLERY":
      return <GallerySection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "LOGO_CLOUD":
      return <LogoCloudSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "PRICING":
      return <PricingSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    case "SPLIT_CONTENT":
      return <SplitContentSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
    default:
      return <DefaultSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
  }
}

// Hero Section - Moderno con gradientes y efectos
function HeroSection({ section }: { section: CmsSection }) {
  const content = section.content || {};
  const buttons = content.buttons || [];
  const bgColor = section.bgColor || "#D66829";

  return (
    <section
      className="relative min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: content.backgroundImage
            ? `linear-gradient(135deg, ${bgColor}ee 0%, ${bgColor}cc 50%, #0B2A5Bcc 100%)`
            : `linear-gradient(135deg, ${bgColor} 0%, #c45a22 50%, #0B2A5B 100%)`,
        }}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0B2A5B]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 text-center py-20 text-white z-10">
        {content.badge && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-8 animate-fade-in">
            <Shield className="h-4 w-4" />
            {content.badge}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 max-w-5xl mx-auto leading-tight">
          {section.title}
        </h1>

        {section.subtitle && (
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            {section.subtitle}
          </p>
        )}

        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buttons.map((btn: any, index: number) => (
              <Button
                key={index}
                asChild
                size="lg"
                className={
                  btn.variant === "secondary"
                    ? "h-14 px-8 border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg rounded-xl backdrop-blur-sm"
                    : "h-14 px-8 bg-white text-[#D66829] hover:bg-white/90 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all"
                }
              >
                <Link href={btn.url}>
                  {btn.text}
                  {btn.variant !== "secondary" && <ArrowRight className="ml-2 h-5 w-5" />}
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-white/50" />
        </div>
      </div>
    </section>
  );
}

// Text Section - Moderno
function TextSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4 max-w-4xl">
        {section.title && (
          <div className="text-center mb-10">
            <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto mt-4 rounded-full" />
          </div>
        )}
        {content.html && (
          <div
            className={`prose prose-lg max-w-none ${isDark ? "prose-invert" : "prose-slate"} prose-headings:text-[#D66829] prose-a:text-[#D66829] prose-strong:text-[#0B2A5B]`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html) }}
          />
        )}
      </div>
    </section>
  );
}

// Cards Section - Diseño moderno con hover effects
function CardsSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const cards = content.cards || [];
  const columns = content.columns || 4;
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  // Detectar si son tarjetas de ubicación (tienen address)
  const isLocationCards = cards.length > 0 && cards[0].address;

  if (isLocationCards) {
    return <LocationCardsSection section={section} paddingClass={paddingClass} bgStyle={bgStyle} />;
  }

  const gridColsMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  };
  const gridCols = gridColsMap[columns] || "lg:grid-cols-4";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 ${isDark ? "bg-white/20 text-white" : "bg-[#D66829]/10 text-[#D66829]"}`}>
              {content.badge || "Servicios"}
            </span>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            {section.subtitle && (
              <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-6 md:grid-cols-2 ${gridCols}`}>
          {cards.map((card: any, index: number) => {
            const Icon = ICONS[card.icon] || Scale;
            return (
              <Card
                key={index}
                className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                  isDark ? "bg-white/10 backdrop-blur-sm border-white/20" : "bg-white border-slate-200"
                }`}
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    isDark ? "bg-white/20" : "bg-gradient-to-br from-[#D66829]/10 to-[#0B2A5B]/10"
                  }`}>
                    <Icon className={`h-7 w-7 ${isDark ? "text-white" : "text-[#D66829]"}`} />
                  </div>
                  <CardTitle className={`text-xl ${isDark ? "text-white" : "text-slate-900"}`}>
                    {card.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <CardDescription className={`text-base leading-relaxed ${isDark ? "text-white/70" : "text-slate-600"}`}>
                    {card.description}
                  </CardDescription>
                  {card.url && (
                    <Link
                      href={card.url}
                      className={`inline-flex items-center gap-2 mt-6 font-semibold transition-all group/link ${
                        isDark ? "text-white hover:text-white/80" : "text-[#D66829] hover:text-[#0B2A5B]"
                      }`}
                      target={card.url.startsWith("http") ? "_blank" : undefined}
                    >
                      {card.linkText || "Más información"}
                      <ArrowRight className="h-4 w-4 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Location Cards Section - Para sedes/ubicaciones con mapa
function LocationCardsSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const cards = content.cards || [];
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 ${isDark ? "bg-white/20 text-white" : "bg-[#D66829]/10 text-[#D66829]"}`}>
              {content.badge || "Ubicaciones"}
            </span>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            {section.subtitle && (
              <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-8">
          {cards.map((location: any, index: number) => (
            <Card key={index} className="border-0 shadow-xl overflow-hidden">
              {/* Mapa */}
              {location.mapUrl && (
                <div className="aspect-[21/9] relative bg-slate-100">
                  <iframe
                    src={location.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, position: "absolute", inset: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2">
                {/* Información */}
                <CardContent className="p-8 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-slate-900">{location.title}</h3>
                      {location.isMainOffice && (
                        <span className="px-2 py-1 text-xs font-semibold bg-[#D66829] text-white rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-slate-600">{location.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Dirección */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-[#D66829]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Dirección</p>
                        <p className="text-slate-600">
                          {location.address}
                          {location.city && <><br />{location.city}</>}
                          {location.country && <>, {location.country}</>}
                        </p>
                      </div>
                    </div>

                    {/* Teléfono */}
                    {location.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                          <Phone className="h-5 w-5 text-[#D66829]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Teléfono</p>
                          <a
                            href={`tel:${location.phone.replace(/\s/g, "")}`}
                            className="text-[#D66829] hover:underline"
                          >
                            {location.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {location.email && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                          <Mail className="h-5 w-5 text-[#D66829]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Email</p>
                          <a
                            href={`mailto:${location.email}`}
                            className="text-[#D66829] hover:underline"
                          >
                            {location.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Horario */}
                    {location.hours && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D66829]/10 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-[#D66829]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Horario</p>
                          <p className="text-slate-600">{location.hours}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {location.mapUrl && (
                      <a
                        href={location.mapUrl.includes("embed") ? location.mapUrl.replace("/embed?", "/maps?") : location.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-[#D66829] hover:bg-[#c45a22]">
                          <MapPin className="h-4 w-4 mr-2" />
                          Cómo Llegar
                        </Button>
                      </a>
                    )}
                    <Link href="/contacto">
                      <Button variant="outline">
                        Contactar
                      </Button>
                    </Link>
                  </div>
                </CardContent>

                {/* Servicios disponibles (si existen) */}
                {location.services && location.services.length > 0 && (
                  <div className="p-8 bg-slate-50 border-l">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">
                      Servicios Disponibles
                    </h4>
                    <ul className="space-y-3">
                      {location.services.map((service: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#D66829] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">{idx + 1}</span>
                          </div>
                          <span className="text-slate-600">{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Stats Section - Diseño moderno con animaciones
function StatsSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const stats = content.stats || [];

  return (
    <section
      className={`${paddingClass} relative overflow-hidden`}
      style={{
        background: section.bgColor || "linear-gradient(135deg, #D66829 0%, #c45a22 50%, #b34f1d 100%)",
        ...bgStyle,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#0B2A5B]/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {section.title && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{section.title}</h2>
            {section.subtitle && (
              <p className="text-lg text-white/80 max-w-2xl mx-auto">{section.subtitle}</p>
            )}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat: any, index: number) => (
            <div key={index} className="text-center group">
              <div className="relative">
                <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 transition-transform duration-300 group-hover:scale-110">
                  {stat.value}
                </div>
                <div className="w-16 h-1 bg-white/30 mx-auto rounded-full" />
              </div>
              <div className="text-lg md:text-xl mt-4 text-white/90 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section - Moderno con efectos
function CTASection({ section, paddingClass, bgStyle, textStyle }: any) {
  const content = section.content || {};
  const bgColor = section.bgColor || "#0B2A5B";

  return (
    <section
      className={`${paddingClass} relative overflow-hidden`}
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, #0d3a7a 50%, ${bgColor} 100%)`,
        ...textStyle,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D66829]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {section.title && (
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-4xl mx-auto">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {section.subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {content.buttonText && (
            <Button
              asChild
              size="lg"
              className="h-14 px-8 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all"
            >
              <Link href={content.buttonUrl || "#"}>
                {content.buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
          {content.secondaryButtonText && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg rounded-xl backdrop-blur-sm"
            >
              <Link href={content.secondaryButtonUrl || "#"}>
                {content.secondaryButtonText}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// Team Section - Moderno
function TeamSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const members = content.members || [];
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";
  const layout = content.layout || "grid";
  const columns = content.columns || 3;
  const showBio = content.showBio !== false;
  const showContact = content.showContact || false;

  const gridColsMap: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };
  const gridCols = gridColsMap[columns] || "md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto rounded-full" />
            {section.subtitle && (
              <p className={`text-lg mt-6 max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-8 ${layout === "detailed" || layout === "list" ? "max-w-3xl mx-auto" : `${gridCols} max-w-6xl mx-auto`}`}>
          {members.map((member: any, index: number) => (
            <div
              key={member.id || index}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                isDark ? "bg-white/10 backdrop-blur-sm" : "bg-white shadow-lg"
              }`}
            >
              <div className={`p-8 ${layout === "detailed" || layout === "list" ? "flex gap-6 items-start text-left" : "text-center"}`}>
                <div className={`relative ${layout === "detailed" || layout === "list" ? "w-24 h-24 shrink-0" : "w-32 h-32 mx-auto mb-6"}`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D66829] to-[#0B2A5B] p-1">
                    <div className={`w-full h-full rounded-full overflow-hidden ${isDark ? "bg-white/20" : "bg-slate-100"}`}>
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${isDark ? "text-white" : "text-[#D66829]"}`}>
                          {member.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {member.name}
                  </h3>
                  <p className="text-[#D66829] font-medium mb-3">{member.role}</p>

                  {member.category && (
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mb-3 ${isDark ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {member.category}
                    </span>
                  )}

                  {showContact && (
                    <div className={`space-y-1 mb-3 text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}>
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </a>
                      )}
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="flex items-center gap-2 hover:text-[#D66829] transition-colors">
                          <Phone className="h-4 w-4" />
                          {member.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {showBio && member.bio && (
                    <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-slate-600"}`}>
                      {member.bio}
                    </p>
                  )}

                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-sm mt-3 hover:text-[#D66829] transition-colors ${isDark ? "text-white/60" : "text-slate-500"}`}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Timeline Section - Moderno
function TimelineSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const items = content.items || [];

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4 max-w-4xl">
        {section.title && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto rounded-full" />
          </div>
        )}

        <div className="relative">
          {/* Línea vertical con gradiente */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D66829] via-[#D66829]/50 to-[#0B2A5B] -translate-x-1/2 rounded-full" />

          <div className="space-y-12">
            {items.map((item: any, index: number) => (
              <div key={index} className={`relative flex items-start gap-6 md:gap-12 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                {/* Punto con número */}
                <div className="absolute left-4 md:left-1/2 w-10 h-10 -translate-x-1/2 z-10">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Contenido */}
                <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${index % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 group">
                    <h3 className="font-bold text-xl text-[#D66829] mb-2 group-hover:text-[#0B2A5B] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Accordion Section (FAQ) - Moderno
function AccordionSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const items = content.items || [];

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4 max-w-3xl">
        {section.title && (
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 bg-[#D66829]/10 text-[#D66829]">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto rounded-full" />
          </div>
        )}

        <div className="space-y-4">
          {items.map((item: any, index: number) => (
            <details key={index} className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-slate-100">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-slate-900 hover:text-[#D66829] transition-colors">
                <span className="pr-4">{item.title || item.question}</span>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D66829]/10 flex items-center justify-center group-open:bg-[#D66829] transition-colors">
                  <ChevronDown className="h-5 w-5 text-[#D66829] group-open:text-white transition-all group-open:rotate-180" />
                </div>
              </summary>
              <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {item.content || item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// Gallery Section - Moderno con grid masonry
function GallerySection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const images = content.images || [];

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto rounded-full" />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {images.map((image: any, index: number) => (
            <div
              key={index}
              className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg hover:shadow-2xl transition-all"
            >
              <img
                src={image.url}
                alt={image.alt || ""}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-medium">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Form Section - Moderno
function ContactFormSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const submitText = content.submitText || "Enviar Mensaje";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 max-w-6xl mx-auto">
          {/* Info side */}
          <div>
            {section.title && (
              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{section.title}</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] rounded-full" />
                {section.subtitle && (
                  <p className="text-lg text-slate-600 mt-6">{section.subtitle}</p>
                )}
              </div>
            )}

            <div className="space-y-6">
              <a
                href="tel:+51913755003"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#D66829]/10 transition-colors group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Teléfono</p>
                  <p className="font-semibold text-slate-900">(51) 913 755 003</p>
                </div>
              </a>

              <a
                href="mailto:mesadepartes@caardpe.com"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#D66829]/10 transition-colors group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900">mesadepartes@caardpe.com</p>
                </div>
              </a>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white shadow-lg shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Dirección</p>
                  <p className="font-semibold text-slate-900">Jr Paramonga 311, oficina 702</p>
                  <p className="text-slate-600">Santiago de Surco, Lima, Perú</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D66829] to-[#c45a22] text-white shadow-lg shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Horario de Atención</p>
                  <p className="font-semibold text-slate-900">Lunes a Viernes</p>
                  <p className="text-slate-600">9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form side */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium">Nombre completo</Label>
                  <Input
                    id="name"
                    placeholder="Su nombre"
                    className="h-12 rounded-xl border-slate-200 focus:border-[#D66829] focus:ring-[#D66829]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="h-12 rounded-xl border-slate-200 focus:border-[#D66829] focus:ring-[#D66829]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-medium">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="Su número de teléfono"
                  className="h-12 rounded-xl border-slate-200 focus:border-[#D66829] focus:ring-[#D66829]/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-slate-700 font-medium">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="¿En qué podemos ayudarle?"
                  className="h-12 rounded-xl border-slate-200 focus:border-[#D66829] focus:ring-[#D66829]/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-700 font-medium">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escriba su mensaje..."
                  rows={5}
                  className="rounded-xl border-slate-200 focus:border-[#D66829] focus:ring-[#D66829]/20 resize-none"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {submitText}
                <Send className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// Embed Section - Moderno
function EmbedSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto rounded-full" />
          </div>
        )}
        {content.embedUrl && (
          <div className="aspect-video max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
            <iframe
              src={content.embedUrl}
              className="w-full h-full"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
}

// Testimonials Section - Moderno
function TestimonialsSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const testimonials = content.testimonials || [];
  const columns = content.columns || 3;
  const showRating = content.showRating || false;

  const gridColsMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
  };
  const gridCols = gridColsMap[columns] || "lg:grid-cols-3";

  return (
    <section className={`${paddingClass} relative bg-slate-50`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 bg-[#D66829]/10 text-[#D66829]">
              Testimonios
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {section.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D66829] to-[#0B2A5B] mx-auto rounded-full" />
            {section.subtitle && (
              <p className="text-lg text-slate-600 mt-6 max-w-2xl mx-auto">
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-8 md:grid-cols-2 ${gridCols} max-w-6xl mx-auto`}>
          {testimonials.map((testimonial: any, index: number) => {
            // Soportar ambos formatos: name/company y authorName/authorCompany
            const name = testimonial.authorName || testimonial.name;
            const role = testimonial.authorRole || "";
            const company = testimonial.authorCompany || testimonial.company;
            const image = testimonial.authorImage || testimonial.image;
            const rating = testimonial.rating;

            return (
              <div
                key={testimonial.id || index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative"
              >
                {/* Quote icon */}
                <div className="absolute -top-4 left-8">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center shadow-lg">
                    <Quote className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Rating stars */}
                {showRating && rating && (
                  <div className="flex gap-1 mt-4 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                )}

                <p className={`text-slate-600 italic leading-relaxed ${showRating && rating ? "mt-2" : "mt-4"} mb-6`}>
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D66829] to-[#0B2A5B] flex items-center justify-center text-white font-bold shadow-md">
                      {name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="text-sm text-[#D66829]">
                      {role}
                      {role && company && " - "}
                      {company}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Slider/Banner Section - Carrusel avanzado
function SliderSection({ section }: { section: CmsSection }) {
  const content = section.content || {};
  const slides: CarouselSlide[] = (content.slides || []).map((slide: any, index: number) => ({
    id: slide.id || `slide-${index}`,
    image: slide.image || slide.backgroundImage || "",
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    buttonText: slide.buttonText,
    buttonUrl: slide.buttonUrl,
    secondaryButtonText: slide.secondaryButtonText,
    secondaryButtonUrl: slide.secondaryButtonUrl,
    overlayColor: slide.overlayColor || "#000000",
    overlayOpacity: slide.overlayOpacity ?? 40,
    textAlign: slide.textAlign || "center",
    textColor: slide.textColor || "#ffffff",
  }));

  return (
    <Carousel
      slides={slides}
      autoPlay={content.autoPlay !== false}
      autoPlayInterval={content.autoPlayInterval || 5000}
      showArrows={content.showArrows !== false}
      showDots={content.showDots !== false}
      showPlayPause={content.showPlayPause || false}
      height={content.height || "lg"}
      effect={content.effect || "fade"}
    />
  );
}

// Feature Grid Section - Grid de características con iconos
function FeatureGridSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const features = content.features || [];
  const columns = content.columns || 3;
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  const gridColsMap: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    6: "md:grid-cols-3 lg:grid-cols-6",
  };
  const gridCols = gridColsMap[columns] || "md:grid-cols-3";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            {content.badge && (
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 ${isDark ? "bg-white/20 text-white" : "bg-[#D66829]/10 text-[#D66829]"}`}>
                {content.badge}
              </span>
            )}
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className={`w-24 h-1 mx-auto rounded-full ${isDark ? "bg-white/50" : "bg-gradient-to-r from-[#D66829] to-[#0B2A5B]"}`} />
            {section.subtitle && (
              <p className={`text-lg mt-6 max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-8 ${gridCols}`}>
          {features.map((feature: any, index: number) => {
            const Icon = ICONS[feature.icon] || CheckCircle;
            return (
              <div
                key={index}
                className={`group text-center p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
                  isDark ? "hover:bg-white/10" : "hover:bg-slate-50 hover:shadow-lg"
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  isDark ? "bg-white/20" : "bg-gradient-to-br from-[#D66829]/10 to-[#0B2A5B]/10"
                }`}>
                  <Icon className={`h-8 w-8 ${isDark ? "text-white" : "text-[#D66829]"}`} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${isDark ? "text-white/70" : "text-slate-600"}`}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Dynamic Form Section - Formularios personalizados
function DynamicFormSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const formConfig: FormConfig = {
    id: section.id,
    title: content.formTitle || section.title || "",
    description: content.formDescription || section.subtitle || "",
    fields: content.fields || [],
    submitButton: content.submitButton || { text: "Enviar", style: "primary" },
    successMessage: content.successMessage || "¡Gracias! Hemos recibido tu mensaje.",
    errorMessage: content.errorMessage || "Hubo un error al enviar. Por favor intenta nuevamente.",
    emailTo: content.emailTo,
    redirectUrl: content.redirectUrl,
  };

  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4 max-w-2xl">
        {section.title && !content.formTitle && (
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className={`w-24 h-1 mx-auto rounded-full ${isDark ? "bg-white/50" : "bg-gradient-to-r from-[#D66829] to-[#0B2A5B]"}`} />
            {section.subtitle && (
              <p className={`text-lg mt-6 ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`rounded-3xl p-8 ${isDark ? "bg-white/10 backdrop-blur-sm" : "bg-white shadow-xl border border-slate-100"}`}>
          <DynamicForm config={formConfig} />
        </div>
      </div>
    </section>
  );
}

// Video Section - Reproductor de video con overlay
function VideoSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  // Detectar tipo de video (YouTube, Vimeo, o directo)
  const getVideoEmbed = (url: string) => {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  const embedUrl = getVideoEmbed(content.videoUrl);

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className={`w-24 h-1 mx-auto rounded-full ${isDark ? "bg-white/50" : "bg-gradient-to-r from-[#D66829] to-[#0B2A5B]"}`} />
            {section.subtitle && (
              <p className={`text-lg mt-6 max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {content.thumbnail && !content.autoPlay ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
              <img
                src={content.thumbnail}
                alt={section.title || "Video thumbnail"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/50">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                  <Play className="h-10 w-10 text-[#D66829] ml-1" />
                </div>
              </div>
            </div>
          ) : embedUrl ? (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
              />
            </div>
          ) : content.videoFile ? (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
              <video
                src={content.videoFile}
                controls
                autoPlay={content.autoPlay}
                muted={content.muted}
                loop={content.loop}
                className="w-full h-full object-contain"
                poster={content.thumbnail}
              />
            </div>
          ) : null}

          {content.caption && (
            <p className={`text-center mt-4 text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}>
              {content.caption}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Logo Cloud Section - Grid de logos de clientes/partners
function LogoCloudSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const logos = content.logos || [];
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";
  const style = content.style || "grid"; // grid, carousel, marquee

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-12">
            <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            {section.subtitle && (
              <p className={`text-base ${isDark ? "text-white/70" : "text-slate-500"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        {style === "marquee" ? (
          <div className="overflow-hidden">
            <div className="flex animate-marquee">
              {[...logos, ...logos].map((logo: any, index: number) => (
                <div
                  key={index}
                  className="flex-shrink-0 mx-8 w-32 h-16 flex items-center justify-center"
                >
                  <img
                    src={logo.url}
                    alt={logo.name || "Partner logo"}
                    className={`max-w-full max-h-full object-contain ${isDark ? "brightness-0 invert opacity-70" : "grayscale opacity-60 hover:grayscale-0 hover:opacity-100"} transition-all duration-300`}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {logos.map((logo: any, index: number) => (
              <div
                key={index}
                className="w-32 h-16 flex items-center justify-center"
              >
                {logo.url ? (
                  <img
                    src={logo.url}
                    alt={logo.name || "Partner logo"}
                    className={`max-w-full max-h-full object-contain ${isDark ? "brightness-0 invert opacity-70 hover:opacity-100" : "grayscale opacity-60 hover:grayscale-0 hover:opacity-100"} transition-all duration-300`}
                  />
                ) : (
                  <div className={`text-lg font-bold ${isDark ? "text-white/50" : "text-slate-400"}`}>
                    {logo.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Pricing Section - Planes de precios
function PricingSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const plans = content.plans || [];
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center mb-16">
            {content.badge && (
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 ${isDark ? "bg-white/20 text-white" : "bg-[#D66829]/10 text-[#D66829]"}`}>
                {content.badge}
              </span>
            )}
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className={`w-24 h-1 mx-auto rounded-full ${isDark ? "bg-white/50" : "bg-gradient-to-r from-[#D66829] to-[#0B2A5B]"}`} />
            {section.subtitle && (
              <p className={`text-lg mt-6 max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan: any, index: number) => (
            <div
              key={index}
              className={`relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 ${
                plan.featured
                  ? "bg-gradient-to-br from-[#D66829] to-[#0B2A5B] text-white shadow-2xl scale-105"
                  : isDark
                  ? "bg-white/10 backdrop-blur-sm border border-white/20"
                  : "bg-white shadow-xl border border-slate-100"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-[#D66829] shadow-lg">
                    {plan.featuredLabel || "Más Popular"}
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.featured ? "text-white" : isDark ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.featured ? "text-white/80" : isDark ? "text-white/60" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="text-center mb-8">
                <div className={`text-5xl font-bold ${plan.featured ? "text-white" : "text-[#D66829]"}`}>
                  {plan.currency || "S/"}{plan.price}
                </div>
                <p className={`text-sm mt-1 ${plan.featured ? "text-white/70" : isDark ? "text-white/50" : "text-slate-400"}`}>
                  {plan.period || "por mes"}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {(plan.features || []).map((feature: string, fIndex: number) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.featured ? "text-white" : "text-[#D66829]"}`} />
                    <span className={plan.featured ? "text-white/90" : isDark ? "text-white/70" : "text-slate-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className={`w-full h-14 rounded-xl text-lg font-semibold transition-all ${
                  plan.featured
                    ? "bg-white text-[#D66829] hover:bg-white/90 shadow-lg"
                    : "bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white shadow-lg"
                }`}
              >
                <Link href={plan.buttonUrl || "#"}>
                  {plan.buttonText || "Comenzar"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Split Content Section - Contenido dividido imagen/texto
function SplitContentSection({ section, paddingClass, bgStyle }: any) {
  const content = section.content || {};
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";
  const imagePosition = content.imagePosition || "left";
  const buttons = content.buttons || [];

  return (
    <section className={`${paddingClass} relative overflow-hidden`} style={bgStyle}>
      <div className="container mx-auto px-4">
        <div className={`grid gap-12 lg:gap-20 items-center lg:grid-cols-2 ${imagePosition === "right" ? "" : "lg:grid-flow-col-dense"}`}>
          {/* Image side */}
          <div className={`relative ${imagePosition === "right" ? "lg:order-2" : ""}`}>
            {content.image && (
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#D66829]/20 rounded-2xl -z-10" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#0B2A5B]/20 rounded-2xl -z-10" />

                <img
                  src={content.image}
                  alt={section.title || ""}
                  className="w-full rounded-2xl shadow-2xl"
                />

                {/* Floating stats card */}
                {content.floatingCard && (
                  <div className="absolute -bottom-8 -right-8 md:right-8 bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
                    <div className="text-3xl font-bold text-[#D66829]">{content.floatingCard.value}</div>
                    <div className="text-sm text-slate-600">{content.floatingCard.label}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content side */}
          <div className={imagePosition === "right" ? "lg:order-1" : ""}>
            {content.badge && (
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 ${isDark ? "bg-white/20 text-white" : "bg-[#D66829]/10 text-[#D66829]"}`}>
                {content.badge}
              </span>
            )}

            {section.title && (
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
                {section.title}
              </h2>
            )}

            {section.subtitle && (
              <p className={`text-xl mb-6 ${isDark ? "text-white/90" : "text-slate-700"}`}>
                {section.subtitle}
              </p>
            )}

            {content.text && (
              <div
                className={`prose prose-lg max-w-none mb-8 ${isDark ? "prose-invert" : "prose-slate"}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.text) }}
              />
            )}

            {/* Feature list */}
            {content.features && content.features.length > 0 && (
              <ul className="space-y-4 mb-8">
                {content.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-white/20" : "bg-[#D66829]/10"}`}>
                      <CheckCircle className={`h-4 w-4 ${isDark ? "text-white" : "text-[#D66829]"}`} />
                    </div>
                    <span className={isDark ? "text-white/80" : "text-slate-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Buttons */}
            {buttons.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {buttons.map((btn: any, index: number) => (
                  btn.config ? (
                    <CmsButton key={index} config={btn.config as ButtonConfig} />
                  ) : (
                    <Button
                      key={index}
                      asChild
                      size="lg"
                      className={
                        btn.variant === "secondary"
                          ? `h-12 px-6 ${isDark ? "border-white/30 bg-white/10 hover:bg-white/20 text-white" : "border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700"} border-2 rounded-xl`
                          : "h-12 px-6 bg-gradient-to-r from-[#D66829] to-[#c45a22] hover:from-[#c45a22] hover:to-[#b34f1d] text-white rounded-xl shadow-lg"
                      }
                      variant={btn.variant === "secondary" ? "outline" : "default"}
                    >
                      <Link href={btn.url || "#"}>
                        {btn.text}
                        {btn.variant !== "secondary" && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Link>
                    </Button>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Default Section (fallback)
function DefaultSection({ section, paddingClass, bgStyle }: any) {
  const isDark = section.bgColor === "#D66829" || section.bgColor === "#0B2A5B";

  return (
    <section className={`${paddingClass} relative`} style={bgStyle}>
      <div className="container mx-auto px-4">
        {section.title && (
          <div className="text-center">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              {section.title}
            </h2>
            <div className={`w-24 h-1 mx-auto rounded-full ${isDark ? "bg-white/50" : "bg-gradient-to-r from-[#D66829] to-[#0B2A5B]"}`} />
          </div>
        )}
        {section.subtitle && (
          <p className={`text-center text-lg mt-6 max-w-2xl mx-auto ${isDark ? "text-white/80" : "text-slate-600"}`}>
            {section.subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
