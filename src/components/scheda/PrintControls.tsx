"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";

export default function PrintControls() {
  const router = useRouter();
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 3, displayPrint: "none" }}>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
        Indietro
      </Button>
      <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
        Stampa / Salva PDF
      </Button>
    </Box>
  );
}
