import { createTheme, type ThemeOptions, type Shadows } from "@mui/material/styles";

// Colori del triage (codice di priorità in PS). Definiti nel tema — non
// hardcodati nei componenti — così il dark mode può usare tonalità con il giusto
// contrasto. Le chiavi sono in minuscolo (vedi triageKey() in TriageChip).
export type TriageKey = "rosso" | "arancione" | "azzurro" | "verde" | "bianco";

export interface TriageColor {
  main: string;
  contrastText: string;
}

// Augmentazione del tema MUI: aggiunge la sezione `triage` alla palette.
declare module "@mui/material/styles" {
  interface Palette {
    triage: Record<TriageKey, TriageColor>;
  }
  interface PaletteOptions {
    triage?: Record<TriageKey, TriageColor>;
  }
}

const lightTriage: Record<TriageKey, TriageColor> = {
  rosso: { main: "#d32f2f", contrastText: "#ffffff" },
  arancione: { main: "#ed6c02", contrastText: "#ffffff" },
  azzurro: { main: "#0288d1", contrastText: "#ffffff" },
  verde: { main: "#2e7d32", contrastText: "#ffffff" },
  bianco: { main: "#e0e0e0", contrastText: "#212121" },
};

const darkTriage: Record<TriageKey, TriageColor> = {
  rosso: { main: "#f44336", contrastText: "#000000" },
  arancione: { main: "#ffa726", contrastText: "#000000" },
  azzurro: { main: "#29b6f6", contrastText: "#000000" },
  verde: { main: "#66bb6a", contrastText: "#000000" },
  bianco: { main: "#f5f5f5", contrastText: "#212121" },
};

// Ombre morbide custom: le default MUI sono nette/scure. Tonalità verde-petrolio
// del brand a bassissima opacità per un look "premium" e meno duro.
const softShadow = (e: number): string => {
  const y = e;
  const blur = Math.round(e * 1.8);
  const alpha = (0.04 + e * 0.012).toFixed(3);
  return `0px ${y}px ${blur}px rgba(12, 38, 38, ${alpha})`;
};
const softShadows = Array.from({ length: 25 }, (_, i) =>
  i === 0 ? "none" : softShadow(i)
) as Shadows;

// Token condivisi tra tema chiaro e scuro (tipografia, forma, ecc.).
const sharedOptions: ThemeOptions = {
  shape: { borderRadius: 10 },
  shadows: softShadows,
  typography: {
    fontFamily: "var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    h1: { fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h2: { fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3 },
    h3: { fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.005em" },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none", borderRadius: 8 } },
    },
    MuiPaper: {
      // Disattiva l'overlay automatico da elevazione in dark mode (schiarisce le card):
      // preferiamo controllare noi i colori delle superfici.
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiOutlinedInput: {
      // Sfondo pieno (paper) per i campi: risaltano sullo sfondo tintato della pagina
      // invece di apparire "trasparenti". Vale anche in dark mode (paper scuro).
      styleOverrides: {
        root: ({ theme }) => ({ backgroundColor: theme.palette.background.paper }),
      },
    },
  },
};

export const lightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "light",
    primary: { main: "#0a6b6b" },
    secondary: { main: "#b3261e" },
    // Sfondo appena tintato di brand (più caldo del grigio piatto), paper bianco.
    background: { default: "#eef3f3", paper: "#ffffff" },
    divider: "rgba(12, 38, 38, 0.10)",
    triage: lightTriage,
  },
});

export const darkTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "dark",
    primary: { main: "#4dd0c7" },
    secondary: { main: "#f2b8b5" },
    background: { default: "#0e1414", paper: "#161e1e" },
    triage: darkTriage,
  },
});
