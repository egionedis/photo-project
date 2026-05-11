"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Photo } from "@/lib/types";

export type SiteLanguage = "pt" | "en";

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
  t: (key: TranslationKey) => string;
};

type TranslationKey =
  | "about"
  | "aboutBody"
  | "aboutMe"
  | "closePhoto"
  | "contact"
  | "date"
  | "gallery"
  | "language"
  | "nextPhoto"
  | "noDescription"
  | "none"
  | "previousPhoto"
  | "tags"
  | "untitled"
  | "unknown";

const translations: Record<SiteLanguage, Record<TranslationKey, string>> = {
  pt: {
    about: "Sobre",
    aboutBody: "Este e um album pessoal onde tento capturar as pessoas, os lugares e os movimentos que acontecem na minha vida.",
    aboutMe: "Sobre mim",
    closePhoto: "Fechar fotografia",
    contact: "Contacto",
    date: "Data",
    gallery: "Galeria",
    language: "Idioma",
    nextPhoto: "Proxima fotografia",
    noDescription: "Sem texto.",
    previousPhoto: "Fotografia anterior",
    none: "Nenhuma",
    tags: "Etiquetas",
    untitled: "Sem titulo",
    unknown: "Desconhecido"
  },
  en: {
    about: "About",
    aboutBody: "This is a personal photobook where I try to capture the people, places, and movements that happen in my life.",
    aboutMe: "About me",
    closePhoto: "Close photo",
    contact: "Contact",
    date: "Date",
    gallery: "Gallery",
    language: "Language",
    nextPhoto: "Next photo",
    noDescription: "No description provided.",
    previousPhoto: "Previous photo",
    none: "None",
    tags: "Tags",
    untitled: "Untitled",
    unknown: "Unknown"
  }
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLanguage(): SiteLanguage {
  if (typeof window === "undefined") {
    return "pt";
  }
  return window.localStorage.getItem("site-language") === "en" ? "en" : "pt";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>("pt");

  useEffect(() => {
    setLanguageState(getStoredLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("site-language", language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key) => translations[language][key]
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return value;
}

export function getLocalizedPhotoTitle(photo: Photo, language: SiteLanguage): string {
  if (language === "en") {
    return photo.titleEn?.trim() || photo.title?.trim() || translations.en.untitled;
  }
  return photo.title?.trim() || translations.pt.untitled;
}

export function getLocalizedPhotoDescription(photo: Photo, language: SiteLanguage): string {
  if (language === "en") {
    return photo.descriptionEn?.trim() || photo.description?.trim() || "";
  }
  return photo.description?.trim() || "";
}

export function formatLocalizedDate(value: string | undefined, language: SiteLanguage): string {
  if (!value) {
    return translations[language].unknown;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(language === "pt" ? "pt-PT" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}
