"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { darkTheme, lightTheme } from "@/theme";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedMode = "light" | "dark";

const STORAGE_KEY = "theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemMode, setSystemMode] = useState<ResolvedMode>("light");

  // Allineamento al valore persistito dopo l'hydration. localStorage/matchMedia
  // non sono leggibili lato server, quindi il setState in effect è qui
  // intenzionale e necessario per evitare un mismatch di hydration.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModeState(stored);
    }
    setSystemMode(getSystemMode());
  }, []);

  // Reagisce ai cambi di preferenza di sistema quando mode === "system".
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemMode(mql.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const resolvedMode: ResolvedMode = mode === "system" ? systemMode : mode;
  const theme = resolvedMode === "dark" ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, setMode }),
    [mode, resolvedMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode deve essere usato dentro ThemeModeProvider");
  return ctx;
}
