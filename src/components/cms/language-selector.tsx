/**
 * CAARD - Selector de idioma
 * Solo muestra idiomas activos configurados en el CMS
 * Por defecto solo ES está activo
 */

"use client";

import { useEffect, useState } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, Locale } from "@/lib/i18n";

// Definición de todos los idiomas disponibles
const ALL_LANGUAGES = [
  { code: "es" as Locale, name: "Español", flag: "🇪🇸", isNative: true },
  { code: "en" as Locale, name: "English", flag: "🇺🇸", isNative: true },
  { code: "pt" as const, name: "Português", flag: "🇧🇷", isNative: false },
  { code: "fr" as const, name: "Français", flag: "🇫🇷", isNative: false },
  { code: "de" as const, name: "Deutsch", flag: "🇩🇪", isNative: false },
  { code: "zh-CN" as const, name: "中文", flag: "🇨🇳", isNative: false },
];

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface LanguageSelectorProps {
  /** Lista de códigos de idiomas activos. Si no se proporciona, solo "es" está activo */
  activeLanguages?: string[];
}

export function LanguageSelector({ activeLanguages = ["es", "en"] }: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const [googleTranslateLang, setGoogleTranslateLang] = useState<string | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Filtrar idiomas activos - siempre incluir ES y EN como mínimo
  const defaultLanguages = ["es", "en"];
  const mergedLanguages = [...new Set([...defaultLanguages, ...activeLanguages])];
  const availableLanguages = ALL_LANGUAGES.filter((lang) =>
    mergedLanguages.includes(lang.code)
  );

  // Separar idiomas nativos de los que necesitan Google Translate
  const nativeLanguages = availableLanguages.filter((l) => l.isNative);
  const translateLanguages = availableLanguages.filter((l) => !l.isNative);

  useEffect(() => {
    // Solo cargar Google Translate si hay idiomas no nativos activos
    if (translateLanguages.length === 0) return;

    const addGoogleTranslateScript = () => {
      if (document.getElementById("google-translate-script")) return;

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (!document.getElementById("google_translate_element")) return;

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "es",
            includedLanguages: translateLanguages.map((l) => l.code).join(","),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
        setIsGoogleLoaded(true);
      };
    };

    if (!window.google?.translate) {
      addGoogleTranslateScript();
    } else {
      setIsGoogleLoaded(true);
    }

    // Ocultar el widget original de Google Translate
    const style = document.createElement("style");
    style.id = "google-translate-styles";
    style.innerHTML = `
      #google_translate_element {
        display: none !important;
      }
      .goog-te-banner-frame {
        display: none !important;
      }
      .goog-te-menu-frame {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .skiptranslate {
        display: none !important;
      }
      .goog-te-gadget {
        display: none !important;
      }
    `;

    if (!document.getElementById("google-translate-styles")) {
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById("google-translate-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [translateLanguages.length]);

  // Resetear Google Translate cuando cambiamos a idioma nativo
  const resetGoogleTranslate = () => {
    setGoogleTranslateLang(null);
    const googleSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (googleSelect) {
      googleSelect.value = "";
      googleSelect.dispatchEvent(new Event("change"));
    }
    if (document.cookie.includes("googtrans")) {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.reload();
    }
  };

  const selectNativeLanguage = (langCode: Locale) => {
    resetGoogleTranslate();
    setLocale(langCode);
  };

  const selectGoogleTranslateLanguage = (langCode: string) => {
    setLocale("es");
    setGoogleTranslateLang(langCode);

    setTimeout(() => {
      const googleSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (googleSelect) {
        googleSelect.value = langCode;
        googleSelect.dispatchEvent(new Event("change"));
      }
    }, 100);
  };

  // Determinar el idioma actual mostrado
  const getCurrentLanguageDisplay = () => {
    if (googleTranslateLang) {
      const lang = translateLanguages.find((l) => l.code === googleTranslateLang);
      return lang || nativeLanguages[0];
    }
    const lang = nativeLanguages.find((l) => l.code === locale);
    return lang || nativeLanguages[0];
  };

  const currentLanguage = getCurrentLanguageDisplay();

  return (
    <>
      {/* Contenedor oculto de Google Translate */}
      {translateLanguages.length > 0 && (
        <div id="google_translate_element" style={{ display: "none" }} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
            <span className="sm:hidden">{currentLanguage.flag}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {/* Idiomas nativos */}
          {nativeLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => selectNativeLanguage(lang.code as Locale)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
              {locale === lang.code && !googleTranslateLang && (
                <Check className="h-4 w-4 text-[#D66829]" />
              )}
            </DropdownMenuItem>
          ))}

          {/* Separador y idiomas via Google Translate */}
          {translateLanguages.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Traducción automática
              </div>
              {translateLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => selectGoogleTranslateLanguage(lang.code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {googleTranslateLang === lang.code && (
                    <Check className="h-4 w-4 text-[#D66829]" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
