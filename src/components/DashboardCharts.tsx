"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import DescriptionIcon from "@mui/icons-material/Description";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ContatoreEtichetta, DashboardStats, GiornoConteggio } from "@/lib/stats";

function StatCard({
  label,
  value,
  color = "primary.main",
  icon: Icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon: SvgIconComponent;
}) {
  return (
    <Paper
      sx={{
        p: 3,
        flex: 1,
        minWidth: 180,
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04),
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 28, color }} />
      </Box>
      <Box>
        <Typography variant="h2" sx={{ fontSize: "2.25rem", lineHeight: 1, color }}>
          {value}
        </Typography>
        <Typography color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  );
}

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
          <Box sx={{ height: 10, bgcolor: "action.hover", borderRadius: 5, overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                width: `${(item.count / max) * 100}%`,
                borderRadius: 5,
                background: (theme) =>
                  `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                transition: "width 0.4s ease",
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
              background: (theme) =>
                `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              borderRadius: "4px 4px 0 0",
              minHeight: d.count > 0 ? 4 : 0,
              transition: "height 0.4s ease, opacity 0.15s",
              "&:hover": { opacity: 0.8 },
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

export default function DashboardCharts({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <StatCard label="Schede totali" value={stats.totale} icon={DescriptionIcon} />
        <StatCard label="Bozze" value={stats.bozze} color="warning.main" icon={EditNoteIcon} />
        <StatCard
          label="Completate"
          value={stats.completate}
          color="success.main"
          icon={CheckCircleIcon}
        />
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
    </>
  );
}
