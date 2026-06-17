"use client";

import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import { useThemeMode, type ThemeMode } from "@/context/ThemeContext";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const MODE_LABEL: Record<ThemeMode, string> = {
  light: "Tema chiaro",
  dark: "Tema scuro",
  system: "Tema di sistema",
};

export default function TopBar() {
  const { mode, setMode } = useThemeMode();

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ displayPrint: "none" }}>
      <Toolbar>
        <Typography
          variant="h3"
          component={Link}
          href="/"
          sx={{ flexGrow: 1, color: "text.primary", textDecoration: "none", fontWeight: 700 }}
        >
          Schede Pronto Soccorso
        </Typography>
        <Box>
          <Tooltip title={MODE_LABEL[mode]}>
            <IconButton
              onClick={() => setMode(NEXT_MODE[mode])}
              color="inherit"
              aria-label="Cambia tema"
            >
              {mode === "light" && <LightModeIcon />}
              {mode === "dark" && <DarkModeIcon />}
              {mode === "system" && <SettingsBrightnessIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
