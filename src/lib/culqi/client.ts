/**
 * CAARD - Cliente de Culqi para pagos
 */

import { CULQI_CONFIG, CulqiCharge, CulqiError } from "./config";

interface CreateChargeParams {
  amount: number; // En céntimos (500000 = S/ 5,000.00)
  currency: "PEN" | "USD";
  email: string;
  sourceId: string; // Token de Culqi
  description: string;
  metadata?: Record<string, string>;
}

interface ChargeResult {
  success: boolean;
  charge?: CulqiCharge;
  error?: CulqiError;
}

/**
 * Crea un cargo en Culqi
 */
export async function createCharge(params: CreateChargeParams): Promise<ChargeResult> {
  try {
    const response = await fetch(`${CULQI_CONFIG.apiUrl}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CULQI_CONFIG.privateKey}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency_code: params.currency,
        email: params.email,
        source_id: params.sourceId,
        description: params.description,
        capture: true,
        metadata: params.metadata || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data as CulqiError,
      };
    }

    return {
      success: true,
      charge: data as CulqiCharge,
    };
  } catch (error) {
    console.error("Error creating Culqi charge:", error);
    return {
      success: false,
      error: {
        object: "error",
        type: "api_error",
        merchant_message: "Error de conexión con Culqi",
        user_message: "No se pudo procesar el pago. Intente nuevamente.",
      },
    };
  }
}

/**
 * Verifica si las credenciales de Culqi están configuradas
 */
export function isCulqiConfigured(): boolean {
  return !!(CULQI_CONFIG.publicKey && CULQI_CONFIG.privateKey);
}
