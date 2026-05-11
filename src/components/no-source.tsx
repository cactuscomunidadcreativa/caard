"use client";

/**
 * CAARD - Bloqueo de "ver código fuente"
 * Solo bloquea atajos para ver el código fuente / devtools.
 * NO bloquea: seleccionar texto, copiar (Ctrl+C), click derecho,
 * imprimir, screenshots, Ctrl+A, Ctrl+S.
 */
import { useEffect } from "react";

export function NoSource() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      // Ctrl+U (ver código fuente)
      if (ctrlOrMeta && e.key.toLowerCase() === "u") { e.preventDefault(); return; }
      // F12 (devtools)
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (devtools / consola / inspeccionar)
      if (ctrlOrMeta && e.shiftKey) {
        const k = e.key.toLowerCase();
        if (k === "i" || k === "j" || k === "c") { e.preventDefault(); return; }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
