/**
 * CAARD - Rate Limiter en memoria
 * Protege endpoints sensibles contra brute force y abuso
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

interface RateLimitConfig {
  /** Máximo de requests en la ventana */
  limit: number;
  /** Ventana en segundos */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Verifica rate limit para una clave dada
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Nueva ventana
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { success: true, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Obtiene IP del request (compatible con Cloudflare)
 */
export function getClientIp(request: Request): string {
  // Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Proxy estándar
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

// Configuraciones predefinidas
export const RATE_LIMITS = {
  /** OTP: 5 intentos por minuto por IP */
  otp: { limit: 5, windowSeconds: 60 },
  /** Login: 10 intentos por 15 minutos por IP */
  login: { limit: 10, windowSeconds: 900 },
  /** Pagos: 10 por minuto por IP */
  payment: { limit: 10, windowSeconds: 60 },
  /** API general: 100 por minuto por IP */
  api: { limit: 100, windowSeconds: 60 },
  /** Uploads: 20 por minuto por IP */
  upload: { limit: 20, windowSeconds: 60 },
  /** Solicitudes públicas: 3 por hora por IP */
  publicSubmission: { limit: 3, windowSeconds: 3600 },
} as const;
