import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TopBar from "@/components/TopBar";
import { auth } from "@/lib/auth";
import { getDashboardStats, type ContatoreEtichetta, type GiornoConteggio } from "@/lib/stats";

export const dynamic = "force-dynamic";

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Paper sx={{ p: 3, flex: 1, minWidth: 160 }}>
      <Typography variant="h2" sx={{ fontSize: "2.5rem", color: color ?? "text.primary" }}>
        {value}
      </Typography>
      <Typography color="text.secondary">{label}</Typography>
    </Paper>
  );
}

// Barre orizzontali semplici (niente libreria chart): larghezza proporzionale al max.
function BarList({ items }: { items: ContatoreEtichetta[] }) {
  if (items.length === 0) return <Typography color="text.secondary">Nessun dato</Typography>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item) => (
        <Box key={item.label}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.count}
            </Typography>
          </Box>
          <Box sx={{ height: 8, bgcolor: "action.hover", borderRadius: 1, overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                width: `${(item.count / max) * 100}%`,
                bgcolor: "primary.main",
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function PerGiornoChart({ data }: { data: GiornoConteggio[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 160 }}>
      {data.map((d) => (
        <Box key={d.giorno} sx={{ flex: 1, textAlign: "center" }}>
          <Box
            sx={{
              height: `${(d.count / max) * 130}px`,
              bgcolor: "primary.main",
              borderRadius: "2px 2px 0 0",
              minHeight: d.count > 0 ? 4 : 0,
            }}
            title={`${d.count} schede`}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>
            {format(parseISO(d.giorno), "d/M", { locale: it })}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getDashboardStats();

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Dashboard
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <StatCard label="Schede totali" value={stats.totale} />
          <StatCard label="Bozze" value={stats.bozze} color="warning.main" />
          <StatCard label="Completate" value={stats.completate} color="success.main" />
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Schede create (ultimi 14 giorni)
          </Typography>
          <PerGiornoChart data={stats.perGiorno} />
        </Paper>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Paper sx={{ p: 3, flex: 1, minWidth: 280 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Patologie più frequenti
            </Typography>
            <BarList items={stats.topPatologie} />
          </Paper>
          <Paper sx={{ p: 3, flex: 1, minWidth: 280 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Sintomi più frequenti
            </Typography>
            <BarList items={stats.topSintomi} />
          </Paper>
        </Box>
      </Container>
    </>
  );
}
