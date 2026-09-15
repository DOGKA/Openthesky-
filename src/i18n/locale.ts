export const LOCALES = ["en", "tr", "de", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  tr: "TR",
  de: "DE",
  es: "ES",
};

const TAG: Record<Locale, string> = {
  en: "en-US",
  tr: "tr-TR",
  de: "de-DE",
  es: "es-ES",
};

export function detectLocale(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale || "en";
    const lang = tag.slice(0, 2).toLowerCase();
    if (lang === "tr" || lang === "de" || lang === "es") return lang;
  } catch {
    /* Intl can throw in some runtimes */
  }
  return "en";
}

export function localeTag(locale: Locale): string {
  return TAG[locale];
}
