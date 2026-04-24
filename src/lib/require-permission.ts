/**
 * Helpers de autorización para API routes.
 *
 * Uso:
 *   const session = await requireAuth();
 *   await requirePerm(session, PERMISSIONS.CASES_DELETE);
 *   // ...
 *
 * Si el usuario no está autenticado o no tiene permiso, se lanza una
 * Response adecuada (401 / 403). Los handlers que la llamen deben envolver
 * con try/catch o simplemente dejar que Next lo maneje.
 */
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { hasPermission, type Permission } from "./permissions";

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
    public readonly permission?: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Obtiene la sesión del request y exige que el usuario esté autenticado.
 * Lanza AuthError(401) si no hay sesión.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError(401, "No autorizado");
  }
  return session;
}

/**
 * Obtiene sesión + verifica que tenga el permiso. Lanza AuthError(403)
 * si no lo tiene.
 */
export async function requireAuthWithPermission(
  permission: Permission | string
) {
  const session = await requireAuth();
  if (!hasPermission(session.user as any, permission)) {
    throw new AuthError(
      403,
      `Sin permiso: ${permission}`,
      permission
    );
  }
  return session;
}

/**
 * Convierte un AuthError en NextResponse. Para uso en catch blocks.
 * Ejemplo:
 *   } catch (e) {
 *     const r = authErrorResponse(e);
 *     if (r) return r;
 *     throw e;
 *   }
 */
export function authErrorResponse(e: unknown): NextResponse | null {
  if (e instanceof AuthError) {
    return NextResponse.json(
      { error: e.message, ...(e.permission ? { permission: e.permission } : {}) },
      { status: e.status }
    );
  }
  return null;
}
