import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getTranslation, type Locale, type TranslationKey } from "../lib/i18n";
import { getStoredValue, setStoredValue } from "../lib/storage";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate persisted locale — SecureStore is async
  useEffect(() => {
    let cancelled = false;
    getStoredValue(STORAGE_KEY).then((stored) => {
      if (!cancelled && (stored === "en" || stored === "fil")) {
        setLocaleState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    void setStoredValue(STORAGE_KEY, newLocale);
  }, []);

  const t = useMemo(() => getTranslation(locale), [locale]);

  const contextValue = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
