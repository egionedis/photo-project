"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";

export type SiteLanguage = "en";

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

export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: "en",
      setLanguage: () => undefined,
      t: (key) => translations.en[key]
    }),
    []
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
