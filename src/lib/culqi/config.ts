/**
 * CAARD - Configuración de Culqi (Pasarela de Pagos Perú)
 */

export const CULQI_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || "",
  privateKey: process.env.CULQI_PRIVATE_KEY || "",
  apiUrl: "https://api.culqi.com/v2",
};

// Tipos de Culqi
export interface CulqiToken {
  id: string;
  type: string;
  email: string;
  creation_date: number;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: {
    card_brand: string;
    card_type: string;
    issuer: {
      name: string;
      country: string;
    };
  };
}

export interface CulqiCharge {
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  description: string;
  source_id: string;
  capture: boolean;
  outcome: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  };
  reference_code: string;
  creation_date: number;
}

export interface CulqiError {
  object: string;
  type: string;
  merchant_message: string;
  user_message: string;
}
