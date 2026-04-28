/**
 * /politica-privacidad — Política de Privacidad y Tratamiento de Datos Personales
 * Texto inline (sin PDF) para que cargue inmediatamente.
 */
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidad — CAARD",
  description:
    "Política de Privacidad y Tratamiento de Datos Personales del Centro de Arbitraje y Resolución de Disputas (CAARD). Cumplimiento Ley N° 29733 (Perú).",
};

export default function PoliticaPrivacidadPage() {
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
              <Shield className="h-4 w-4" />
              Protección de datos
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Política de Privacidad
            </h1>
            <p className="text-base md:text-lg text-white/90 leading-relaxed">
              Centro de Arbitraje y Resolución de Disputas — CAARD
            </p>
            <p className="text-sm text-white/70 mt-2">
              Vigente desde abril de 2026 — Ley N° 29733 (Perú)
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-[5vh] bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="bg-white rounded-xl shadow-sm border p-6 md:p-10 prose prose-slate max-w-none">
            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B] mt-0">
              1. Identificación del titular
            </h2>
            <p>
              El responsable del tratamiento de los datos personales es{" "}
              <strong>
                Centro de Administración de Arbitrajes y Resolución de Disputas
                S.A.C.
              </strong>{" "}
              (en adelante, <strong>CAARD</strong>), con RUC{" "}
              <strong>20608962621</strong>, domiciliado en Jr. Aldebarán N° 596,
              Oficina 1409, Edificio IQ Surco, Santiago de Surco, Lima — Perú.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              2. Marco legal
            </h2>
            <p>
              Esta Política se rige por la Ley N° 29733, Ley de Protección de
              Datos Personales, su Reglamento aprobado por Decreto Supremo N°
              003-2013-JUS y normativa complementaria emitida por la Autoridad
              Nacional de Protección de Datos Personales del Perú.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              3. Datos personales recopilados
            </h2>
            <p>
              CAARD recopila únicamente los datos personales necesarios para la
              prestación de sus servicios arbitrales y administrativos. Estos
              pueden incluir:
            </p>
            <ul>
              <li>
                <strong>Datos de identificación:</strong> nombres y apellidos,
                tipo y número de documento de identidad, RUC, fecha de
                nacimiento.
              </li>
              <li>
                <strong>Datos de contacto:</strong> correo electrónico,
                teléfono, dirección, ciudad, país.
              </li>
              <li>
                <strong>Datos profesionales:</strong> hoja de vida, especialidad,
                experiencia, declaraciones juradas, formación académica
                (aplicable a árbitros y abogados).
              </li>
              <li>
                <strong>Datos del expediente arbitral:</strong> documentos
                aportados por las partes, escritos, pruebas, comunicaciones,
                audiencias y demás información vinculada al proceso.
              </li>
              <li>
                <strong>Datos de pago:</strong> comprobantes y referencias para
                el cobro de tarifas; CAARD no almacena números completos de
                tarjetas.
              </li>
              <li>
                <strong>Datos de uso de la plataforma:</strong> registros de
                acceso, dirección IP, navegador y sistema operativo,
                exclusivamente con fines de seguridad y trazabilidad.
              </li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              4. Finalidades del tratamiento
            </h2>
            <p>Los datos personales son tratados para las siguientes finalidades:</p>
            <ul>
              <li>Tramitación, administración y resolución de procesos arbitrales y mecanismos alternativos de solución de controversias.</li>
              <li>Designación, registro y evaluación de árbitros, secretarios arbitrales y mediadores.</li>
              <li>Emisión de notificaciones, comunicaciones procesales y resoluciones.</li>
              <li>Facturación, control de pagos y cumplimiento de obligaciones tributarias.</li>
              <li>Atención de reclamos, quejas y consultas a través del Libro de Reclamaciones y canales oficiales.</li>
              <li>Cumplimiento de obligaciones legales, regulatorias y de prevención de lavado de activos cuando corresponda.</li>
              <li>Mejora continua de la plataforma y los servicios prestados.</li>
              <li>Envío de comunicaciones institucionales, novedades, eventos y formación, siempre con consentimiento previo y opción de baja.</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              5. Confidencialidad
            </h2>
            <p>
              CAARD garantiza la <strong>confidencialidad</strong> de toda la
              información vinculada a los procesos arbitrales, conforme al
              principio de reserva consagrado por la Ley de Arbitraje peruana
              (Decreto Legislativo N° 1071). Los árbitros, secretarios y
              personal administrativo suscriben acuerdos de confidencialidad y
              están sujetos a deberes profesionales y disciplinarios.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              6. Conservación de los datos
            </h2>
            <p>
              Los datos personales se conservarán por el tiempo estrictamente
              necesario para cumplir con la finalidad para la que fueron
              recogidos y, posteriormente, durante los plazos legales de
              archivo aplicables a documentos arbitrales, contables y
              tributarios. Vencidos dichos plazos, los datos serán eliminados o
              anonimizados.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              7. Encargados y transferencias
            </h2>
            <p>
              CAARD podrá encargar el tratamiento de datos a proveedores
              tecnológicos (alojamiento en la nube, correo electrónico,
              firma digital, almacenamiento documental, pasarelas de pago)
              ubicados en el Perú o en el extranjero, los cuales actúan
              siguiendo nuestras instrucciones y bajo niveles equivalentes de
              protección. CAARD <strong>no comercializa</strong> datos
              personales.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              8. Derechos del titular (ARCO)
            </h2>
            <p>
              El titular de los datos personales puede ejercer en cualquier
              momento sus derechos de <strong>acceso, rectificación,
              cancelación y oposición</strong>, así como los de revocación del
              consentimiento e información. Para ejercerlos, deberá enviar una
              solicitud escrita al correo{" "}
              <a
                href="mailto:administracion@caardpe.com"
                className="text-[#D66829] hover:underline"
              >
                administracion@caardpe.com
              </a>{" "}
              acreditando su identidad. CAARD responderá dentro de los plazos
              legales.
            </p>
            <p>
              Si el titular considera que su solicitud no ha sido atendida
              adecuadamente, puede acudir a la{" "}
              <strong>
                Autoridad Nacional de Protección de Datos Personales — Ministerio
                de Justicia y Derechos Humanos
              </strong>
              .
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              9. Medidas de seguridad
            </h2>
            <p>
              CAARD aplica medidas técnicas, organizativas y legales razonables
              para preservar la integridad, confidencialidad y disponibilidad
              de la información. Entre ellas: cifrado en tránsito (HTTPS),
              autenticación con doble factor para accesos privilegiados,
              control de roles y permisos, registros de auditoría y políticas
              internas de seguridad de la información alineadas con
              certificaciones ISO.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              10. Cookies y tecnologías similares
            </h2>
            <p>
              El sitio web de CAARD utiliza cookies estrictamente necesarias
              para el funcionamiento de la plataforma (sesión, preferencias y
              seguridad). No se emplean cookies publicitarias de terceros. El
              usuario puede gestionar las cookies desde la configuración de su
              navegador.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              11. Modificaciones
            </h2>
            <p>
              CAARD podrá actualizar esta Política para reflejar cambios
              normativos, técnicos u operativos. La versión vigente será siempre
              la publicada en este sitio web, indicando la fecha de última
              actualización.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0B2A5B]">
              12. Contacto
            </h2>
            <ul>
              <li>
                <Mail className="inline h-4 w-4 mr-1 text-[#D66829]" />
                Correo institucional:{" "}
                <a
                  href="mailto:administracion@caardpe.com"
                  className="text-[#D66829] hover:underline"
                >
                  administracion@caardpe.com
                </a>
              </li>
              <li>
                <Mail className="inline h-4 w-4 mr-1 text-[#D66829]" />
                Mesa de partes:{" "}
                <a
                  href="mailto:mesadepartes@caardpe.com"
                  className="text-[#D66829] hover:underline"
                >
                  mesadepartes@caardpe.com
                </a>
              </li>
              <li>
                Dirección: Jr. Aldebarán N° 596, Oficina 1409, Edificio IQ
                Surco, Santiago de Surco, Lima — Perú
              </li>
              <li>Teléfono: (+51) 913 755 003</li>
            </ul>

            <div className="mt-10 flex flex-wrap gap-3 not-prose">
              <Link href="/terminos-condiciones">
                <Button
                  variant="outline"
                  className="border-[#0B2A5B] text-[#0B2A5B]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Términos y Condiciones
                </Button>
              </Link>
              <Link href="/libro-de-reclamaciones">
                <Button
                  variant="outline"
                  className="border-[#D66829] text-[#D66829]"
                >
                  📕 Libro de Reclamaciones
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
