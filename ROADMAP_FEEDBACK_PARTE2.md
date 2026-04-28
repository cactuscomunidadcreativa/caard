# Roadmap: Feedback PDF "Comentarios a la web - Parte 2"

Recibido el 2026-04-28. Lo que se pudo hacer en este sprint está marcado ✅.
Lo que requiere trabajo de feature mayor está documentado abajo con una
estimación.

---

## ✅ Hecho en este sprint

- **Tipo de Arbitraje** ahora dice "Arbitraje" / "Arbitraje de Emergencia"
  (antes "Solicitud de Arbitraje").
- **/cases con chips Vigentes / Laudados / Archivados** arriba del filtro.
- **Lupa del header** funcional: navega a `/cases?q=` con el término.
- **Mi Perfil — cambiar foto**: botón ya no está deshabilitado, sube a
  `/avatars/{userId}.{ext}` y actualiza `User.image`.
- **Pestañas del expediente**: agregadas "Órdenes Procesales" y
  "Razón de Secretaría" como tabs separadas (filtran de Documents
  por tipo).
- **Import del Excel v7** con preservación de @caardpe.com.

---

## 🟡 Pendiente — features medianos (1 día c/u)

### 1. Notificaciones con sección "Pendientes de aprobación"
**Pidió:** lista de tareas que el árbitro le envió como indicación, marcar
como "hecho/enviado", y otra sección "pendiente de aprobación por tribunal".

**Plan:**
- Nuevo enum `NotificationKind` en schema: `INDICATION_FROM_ARBITRATOR`,
  `PENDING_APPROVAL_BY_TRIBUNAL`.
- Tab adicional en el panel de notificaciones con esos filtros.
- Acción "Marcar como hecho" que actualiza `metadata.completedAt`.

### 2. /cases agrupado por año dentro de cada chip
**Pidió:** Vigentes 2026, Vigentes 2025, etc.

**Plan:**
- Modo "agrupar por año" toggleable. Cuando está on, los cases se
  renderizan en secciones colapsables `<details>` con header "2026 (12)",
  "2025 (45)", etc.

### 3. Editor de perfil — teléfono de oficina vs personal
**Pidió:** que el celular sea el de oficina, no el personal.

**Plan:**
- Agregar campo `User.phoneOffice` en schema (mantener `phoneE164` como
  personal). UI en `/settings/profile` con dos campos separados.

---

## 🟠 Features grandes (2-5 días c/u)

### 4. CAARDito generador de Acta de Audiencia
**Pidió:** que la grabación se descargue sola, y que el acta se redacte
sola con plantilla. Modificar datos como tipo de audiencia, partes,
fecha hora, identificación de partes, árbitros, etc.

**Plan:**
- Nuevo modelo `HearingMinute` ligado a `CaseHearing`.
- Plantilla en code (Markdown/HTML) con placeholders: `{{caseCode}}`,
  `{{tribunal}}`, `{{secretary}}`, `{{parties}}`, `{{startTime}}`, etc.
- Endpoint `POST /api/cases/[id]/hearings/[hearingId]/minute` que llama
  a `/api/ai/chat` con system prompt: "rellenar plantilla con estos datos".
- UI en `/secretaria/audiencias/[id]` con:
  - Botón "Generar Acta" (auto-rellena con datos de la audiencia).
  - Editor enriquecido para ajustar.
  - "Descargar PDF" con jsPDF/puppeteer.
- Para la grabación, integración con Google Meet API o Zoom API
  (más complejo, dependencias externas).

**Estimación:** 3 días si se integra solo Meet (recordings de Drive).

### 5. CAARDito — listado de pendientes con recordatorio
**Pidió:** árbitro marca tarea como prioritaria, sistema le recuerda 3 veces
al día.

**Plan:**
- Modelo `ReminderQueue { userId, message, priority, nextRunAt, runCount }`.
- Cron de 3 horas chequea queue. Envía email/notification.
- UI en sidebar con badge de tareas prioritarias.

**Estimación:** 1.5 días.

### 6. CAARDito — resumen automático de documentos
**Pidió:** botón que lea un documento y lo resuma.

**Plan:**
- Endpoint `/api/ai/summarize` que recibe `documentId`, descarga el PDF
  desde Drive, extrae texto (`pdf-parse`), llama a Claude para resumir,
  guarda resultado en `CaseDocument.summary` (campo nuevo).
- Botón en cada documento "Resumir" que dispara y muestra el resumen.

**Estimación:** 1 día.

### 7. CAARDito — escritos pendientes de proveer con detalle
**Pidió:** lista cada escrito pendiente con un resumen de qué se está
solicitando (para acelerar el trabajo del árbitro).

**Plan:**
- Endpoint que combina `/api/cases/[id]/escritos` con resumen IA por
  cada escrito en estado SUBMITTED.
- UI en `/arbitro` panel con esta tabla pre-cargada.

**Estimación:** 0.5 día (si #6 ya está hecho).

### 8. Triggers de plazos según flujo procesal del PDF
**Pidió:** definir reglas de plazos automáticos:
- Notificación solicitud → 5DH contestación
- Designación árbitros 5DH
- Demanda → 10DH contestar
- Excepciones → 10DH absolver, laudo parcial 30+15DH
- Audiencia ilustración: 10DH anticipación
- Cierre probatoria → 10DH alegatos
- Audiencia informes orales: 10DH anticipación
- Cierre instrucción → 30+15DH laudar

**Plan:**
- Tabla `ProcedureRule { fromStage, action, daysOffset, isBusinessDays }`.
- Cron diario que evalúa reglas y crea `CaseDeadline` automáticamente.
- UI admin en `/admin/rules` para editar reglas.
- Definir feriados públicos del Perú (ya hay `Holiday` table; cargar 2026).

**Estimación:** 2 días.

### 9. Chat secretaria-secretaria-general
**Pidió:** chat para comunicar entre Vivian (secretaria del expediente) y
Anaís (secretaria general) sobre proyectos para revisión.

**Plan:**
- Tabla `InternalMessage { caseId, fromUserId, toUserId, body, attachments, readAt }`.
- UI tipo Slack ligero en sidebar derecha cuando se entra a un expediente.
- Integración con notificaciones por correo si el destinatario no está online.

**Estimación:** 2.5 días.

### 10. "El juez escucha del PJ" — sección de contacto secretaría
**Pidió:** que las partes/abogados puedan contactar a la secretaría con
horario de oficina, igual al "El juez escucha" del Poder Judicial.

**Plan:**
- Página `/contacto-secretaria` (o tab en expediente) con formulario
  + horario de oficina.
- Out-of-hours muestra "Será respondido en próximo horario hábil".
- Email + notificación a Anaís y Vivian al recibir.

**Estimación:** 1 día.

### 11. Reportes cualitativos — estado procesal de cada caso
**Pidió:** reporte mostrando "lo último que se hizo" y "lo pendiente" por
cada expediente vigente, no solo cuantitativo.

**Plan:**
- Función que para cada caso vigente:
  - Última acción de AuditLog
  - Próximo `CaseDeadline` activo
  - Próxima `CaseHearing` programada
  - Si tiene escrito SUBMITTED pendiente de proveer
- UI en `/staff/reportes` con tabla agrupada por estado procesal y
  semáforo (verde / amarillo / rojo según urgencia).

**Estimación:** 1.5 días.

---

## 🔴 Decisiones que requieren respuesta

### Toggle de idioma ES/EN
La PDF dice "no tiene botón de idioma (igual me parece innecesario)".
**Decisión necesaria:** ¿lo dejamos, lo quitamos o lo escondemos?

**Mi recomendación:** dejarlo escondido por defecto. Hay infraestructura de
i18n hecha (translations en CMS). Si se decide quitarlo de UI puedo
removerlo del header en 5 minutos.

---

## 🔵 Cosas menores que también vi en el PDF

- **"Solicitud de Arbitraje" en otros lados**: la página pública
  `/solicitud-arbitral` y los emails de notificación todavía dicen
  "Solicitud" — eso es correcto porque ahí literalmente se "solicita"
  un arbitraje. El cambio fue solo el `name` del ArbitrationType
  (que es lo que aparece en el detalle del expediente).

- **Pestaña "Documentos"**: actualmente ya muestra todos los docs.
  Si se quiere subdivisión (Solicitud / Contestación / Demanda / etc.)
  como pidió Vivian, hay que agregar un sub-filtro en la tab por
  `documentType`. Es 1-2 horas. Lo dejo para próximo sprint.
