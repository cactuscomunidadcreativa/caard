/**
 * Error boundary del sitio público.
 * Si una página del CMS revienta (schema inválido, sección rota, etc.)
 * mostramos un mensaje contenido en vez de devolver 500 desde Vercel.
 */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

export default function WebsiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[website error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
          <AlertTriangle className="h-8 w-8 text-[#D66829]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0B2A5B] mb-3">
          Estamos teniendo un problema técnico
        </h1>
        <p className="text-muted-foreground mb-6">
          No pudimos cargar esta sección del sitio. Ya estamos avisados.
          Mientras tanto, podés volver al inicio o reintentar.
        </p>
        {error?.digest && (
          <p className="text-xs text-muted-foreground/70 mb-6 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset} variant="outline">
            <RotateCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
