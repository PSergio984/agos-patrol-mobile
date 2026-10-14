import en, { type TranslationKey } from "./en";
import fil from "./fil";

export type Locale = "en" | "fil";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en,
  fil,
};

export function getTranslation(locale: Locale) {
  const strings = translations[locale];
  return (key: TranslationKey) => strings[key] || en[key] || key;
}

export type { TranslationKey };
