"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useToast } from "@/context/ToastContext";

export default function CambiaPasswordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  // Cambio "forzato" (password temporanea impostata dall'admin) vs volontario.
  const forced = session?.user?.forcePasswordChange ?? false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La nuova password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Errore durante il cambio password.");
        return;
      }
      setDone(true);
      if (forced) {
        // Il token JWT contiene ancora forcePasswordChange=true: logout per rigenerarlo.
        setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
      } else {
        showToast("Password aggiornata", "success");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper sx={{ p: 4, width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LockResetIcon color="primary" />
          <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
            Cambia password
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {forced
            ? "Un amministratore ha impostato una password temporanea per il tuo account. Scegline una nuova prima di continuare."
            : "Aggiorna la password del tuo account."}
        </Typography>

        {done ? (
          <Alert severity="success">
            Password aggiornata.{" "}
            {forced ? "Verrai reindirizzato al login…" : "Reindirizzamento in corso…"}
          </Alert>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Password attuale"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              autoFocus
            />
            <TextField
              label="Nuova password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Conferma nuova password"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button type="submit" variant="contained" size="large" disabled={pending}>
              {pending ? "Salvataggio…" : "Imposta nuova password"}
            </Button>
            {!forced && (
              <Button component={Link} href="/" color="inherit">
                Annulla
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
