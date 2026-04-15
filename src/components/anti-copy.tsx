"use client";

/**
 * CAARD - Protección anti-copia
 * Bloquea: click derecho, Ctrl+U, Ctrl+S, Ctrl+Shift+I, print screen, drag
 * NO bloquea: inputs, textareas, copiar dentro del dashboard (solo website público)
 */
import { useEffect } from "react";

export function AntiCopy() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      e.preventDefault();
    };

    // Disable keyboard shortcuts for view source, save, dev tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key === "u") { e.preventDefault(); return; }
      // Ctrl+S (save page)
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); return; }
      // Ctrl+Shift+I (dev tools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") { e.preventDefault(); return; }
      // Ctrl+Shift+J (console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") { e.preventDefault(); return; }
      // Ctrl+Shift+C (inspect element)
      if (e.ctrlKey && e.shiftKey && e.key === "C") { e.preventDefault(); return; }
      // F12 (dev tools)
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+P (print)
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); return; }
      // Ctrl+A (select all) - only on body
      if (e.ctrlKey && e.key === "a") {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          return;
        }
      }
    };

    // Disable drag on images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") { e.preventDefault(); }
    };

    // Disable copy (except in inputs)
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
    };

    // Add no-copy and no-print classes to body
    document.body.classList.add("no-copy", "no-print");

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);

    // Console warning
    console.log(
      "%c⚠️ CAARD - Contenido protegido",
      "color: #D66829; font-size: 20px; font-weight: bold;"
    );
    console.log(
      "%cEl contenido de este sitio está protegido por derechos de autor. La copia, reproducción o distribución no autorizada está prohibida.",
      "color: #0B2A5B; font-size: 14px;"
    );

    return () => {
      document.body.classList.remove("no-copy", "no-print");
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  return null;
}
