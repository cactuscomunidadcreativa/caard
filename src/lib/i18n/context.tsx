"use client";

/**
 * CAARD - Contexto de Internacionalización
 * =========================================
 * Proporciona las traducciones a toda la aplicación
 * Soporta tanto t("key.path") como t.key.path para backwards compatibility
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale, TranslationSection } from "./translations";

// Función helper para obtener valor anidado de un objeto usando notación de puntos
function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return path; // Devolver la clave si no se encuentra
    }
  }
  return typeof value === "string" ? value : path;
}

// Tipo que permite usar t como función y también acceder a propiedades
type TranslateFunction = ((key: string) => string) & TranslationSection;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFunction;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "caard-locale";

// Crear función de traducción que también actúa como objeto de traducciones
function createTranslator(locale: Locale): TranslateFunction {
  const currentTranslations = translations[locale];

  // Función base
  const translator = (key: string) => {
    return getNestedValue(currentTranslations, key);
  };

  // Copiar todas las propiedades de las traducciones a la función
  Object.assign(translator, currentTranslations);

  return translator as TranslateFunction;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  // Cargar idioma guardado al montar
  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (savedLocale && (savedLocale === "es" || savedLocale === "en")) {
      setLocaleState(savedLocale);
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en") {
        setLocaleState("en");
      }
    }
  }, []);

  // Guardar idioma cuando cambie
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    // Actualizar el atributo lang del documento
    document.documentElement.lang = newLocale;
  };

  // Crear traductor que funciona como función y como objeto
  const t = createTranslator(locale);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Hook helper para traducir
export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}
