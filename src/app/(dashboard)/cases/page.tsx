/**
 * CAARD - Lista de expedientes
 *
 * Suspense requerido porque CasesClient usa useSearchParams() para
 * sincronizar filtros y página con la URL (permite volver atrás
 * desde el detalle y mantener la misma vista).
 */

import { Suspense } from "react";
import { CasesClient } from "./cases-client";
import { Loader2 } from "lucide-react";

// Forzar rendering dinámico (no pre-render) porque depende de la URL
export const dynamic = "force-dynamic";

export default function CasesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CasesClient />
    </Suspense>
  );
}
