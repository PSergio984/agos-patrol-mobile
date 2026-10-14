import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { getStoredValue, setStoredValue } from "../lib/storage";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme-mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();

  const [mode, setModeState] = useState<ThemeMode>("system");

  // Hydrate persisted mode — SecureStore is async
  useEffect(() => {
    let cancelled = false;
    getStoredValue(STORAGE_KEY).then((stored) => {
      if (
        !cancelled &&
        (stored === "light" || stored === "dark" || stored === "system")
      ) {
        setModeState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isDark =
    mode === "dark" || (mode === "system" && colorScheme === "dark");

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    void setStoredValue(STORAGE_KEY, newMode);
  }, []);

  // Drive NativeWind's color scheme (this is what makes dark: variants apply)
  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  const contextValue = useMemo(
    () => ({ mode, isDark, setMode }),
    [mode, isDark, setMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
