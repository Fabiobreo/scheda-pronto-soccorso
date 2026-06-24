"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useThemeMode, type ThemeMode } from "@/context/ThemeContext";
import { ROLE_LABEL, hasMinRole } from "@/lib/roles";

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
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const user = session?.user;
  const isAdmin = hasMinRole(user?.role, "ADMIN");

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
          {user && (
            <>
              <Tooltip title="Account">
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  color="inherit"
                  aria-label="Menu account"
                >
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user.name || user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ROLE_LABEL[user.role]}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem component={Link} href="/dashboard" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  Dashboard
                </MenuItem>
                {isAdmin && (
                  <MenuItem component={Link} href="/admin/utenti" onClick={() => setAnchorEl(null)}>
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    Gestione utenti
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem
                    component={Link}
                    href="/admin/cestino"
                    onClick={() => setAnchorEl(null)}
                  >
                    <ListItemIcon>
                      <DeleteOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    Cestino
                  </MenuItem>
                )}
                <MenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Esci
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
