/**
 * Sanitizador de HTML.
 * Se usa antes de inyectar contenido creado por admins (bio de árbitros,
 * artículos del blog, CMS) en dangerouslySetInnerHTML. Aunque solo admins
 * editan, sigue siendo buena higiene: evita que un admin comprometido o
 * un paste malicioso pueda inyectar <script> o handlers.
 */
import DOMPurify from "isomorphic-dompurify";

// Config base: permitir formato rico editorial, bloquear ejecución.
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "td", "th",
  "code", "pre",
  "hr", "span", "div",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "target", "rel",
  "class", "style", // style permite alineación/color editorial
  "width", "height",
  "colspan", "rowspan",
];

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
  });
}
