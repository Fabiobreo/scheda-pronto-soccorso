import Link from "next/link";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h1">Pagina non trovata</Typography>
        <Typography color="text.secondary">La scheda o la pagina richiesta non esiste.</Typography>
        <Box>
          <Link href="/">
            <Button variant="contained">Torna alle schede</Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
