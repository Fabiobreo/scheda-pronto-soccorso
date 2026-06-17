import { createTheme, type ThemeOptions } from "@mui/material/styles";

// Token condivisi tra tema chiaro e scuro (tipografia, forma, ecc.).
const sharedOptions: ThemeOptions = {
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    h1: { fontSize: "1.75rem", fontWeight: 700 },
    h2: { fontSize: "1.4rem", fontWeight: 700 },
    h3: { fontSize: "1.15rem", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none" } },
    },
  },
};

export const lightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "light",
    primary: { main: "#0a6b6b" },
    secondary: { main: "#b3261e" },
    background: { default: "#f6f8f8", paper: "#ffffff" },
  },
});

export const darkTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "dark",
    primary: { main: "#4dd0c7" },
    secondary: { main: "#f2b8b5" },
    background: { default: "#0e1414", paper: "#161e1e" },
  },
});
