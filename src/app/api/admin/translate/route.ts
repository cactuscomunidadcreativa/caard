/**
 * API de Traducción Automática
 * ============================
 * Usa servicios gratuitos:
 * 1. MyMemory API (gratuita, 10,000 palabras/día)
 * 2. LibreTranslate (alternativa open source)
 */

import { NextRequest, NextResponse } from "next/server";

// Tipos
interface TranslateRequest {
  text: string;
  from: string;
  to: string;
}

interface TranslateBatchRequest {
  texts: Array<{ key: string; text: string }>;
  from: string;
  to: string;
}

// MyMemory API (gratuita)
async function translateWithMyMemory(text: string, from: string, to: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }

  throw new Error(data.responseDetails || "Error en MyMemory");
}

// LibreTranslate (alternativa, self-hosted o público)
async function translateWithLibreTranslate(text: string, from: string, to: string): Promise<string> {
  // URL pública de LibreTranslate (puede cambiar)
  const url = "https://libretranslate.com/translate";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: from,
      target: to,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error("Error en LibreTranslate");
  }

  const data = await response.json();
  return data.translatedText;
}

// Función principal de traducción con fallback
async function translateText(text: string, from: string, to: string): Promise<string> {
  // Si el texto está vacío o es muy corto, retornarlo tal cual
  if (!text || text.length < 2) {
    return text;
  }

  // Si ya está en el idioma destino (detectar patrones comunes)
  if (from === to) {
    return text;
  }

  try {
    // Intentar primero con MyMemory (más confiable para español-inglés)
    return await translateWithMyMemory(text, from, to);
  } catch (error) {
    console.error("MyMemory falló, intentando LibreTranslate:", error);

    try {
      // Fallback a LibreTranslate
      return await translateWithLibreTranslate(text, from, to);
    } catch (fallbackError) {
      console.error("LibreTranslate también falló:", fallbackError);
      // Si todo falla, retornar el texto original con marcador
      return `[${to.toUpperCase()}] ${text}`;
    }
  }
}

// POST /api/admin/translate - Traducir un texto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Traducción individual
    if (body.text) {
      const { text, from = "es", to = "en" } = body as TranslateRequest;

      const translated = await translateText(text, from, to);

      return NextResponse.json({
        success: true,
        original: text,
        translated,
        from,
        to,
      });
    }

    // Traducción en lote
    if (body.texts && Array.isArray(body.texts)) {
      const { texts, from = "es", to = "en" } = body as TranslateBatchRequest;

      const results: Array<{ key: string; original: string; translated: string }> = [];

      // Procesar en lotes de 5 para no saturar la API
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const translations = await Promise.all(
          batch.map(async ({ key, text }) => {
            const translated = await translateText(text, from, to);
            return { key, original: text, translated };
          })
        );

        results.push(...translations);

        // Pequeña pausa entre lotes para respetar rate limits
        if (i + batchSize < texts.length) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      return NextResponse.json({
        success: true,
        count: results.length,
        translations: results,
        from,
        to,
      });
    }

    return NextResponse.json(
      { error: "Se requiere 'text' o 'texts'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error en traducción:", error);
    return NextResponse.json(
      { error: error.message || "Error al traducir" },
      { status: 500 }
    );
  }
}

// GET /api/admin/translate - Info del servicio
export async function GET() {
  return NextResponse.json({
    service: "CAARD Translation API",
    providers: ["MyMemory", "LibreTranslate"],
    supportedLanguages: [
      { code: "es", name: "Español" },
      { code: "en", name: "English" },
      { code: "pt", name: "Português" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
      { code: "it", name: "Italiano" },
    ],
    limits: {
      myMemory: "10,000 palabras/día (gratis)",
      libreTranslate: "Sin límite (self-hosted)",
    },
  });
}
