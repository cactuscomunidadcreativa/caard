/**
 * CAARD - Nueva Orden Procesal (página server)
 *
 * Esta página vive detrás de auth y usa useSearchParams en el cliente,
 * por lo que NO debe pre-renderarse en build. Marcamos dynamic para
 * forzar render por request.
 */
import { NuevaOrdenProcesalClient } from "./client";

export const dynamic = "force-dynamic";

export default function Page() {
  return <NuevaOrdenProcesalClient />;
}
