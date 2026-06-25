import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import PersonIcon from "@mui/icons-material/Person";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ChecklistIcon from "@mui/icons-material/Checklist";
import TimelineIcon from "@mui/icons-material/Timeline";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import HomeIcon from "@mui/icons-material/Home";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FlagIcon from "@mui/icons-material/Flag";
import DescriptionIcon from "@mui/icons-material/Description";
import type { SvgIconComponent } from "@mui/icons-material";

// Icona associata a ciascuna sezione, scelta automaticamente dal titolo: così
// editor e vista read-only restano invariati e non c'è una lista da tenere allineata.
const SECTION_ICON: Record<string, SvgIconComponent> = {
  "Dati paziente": PersonIcon,
  "Valutazione iniziale": MonitorHeartIcon,
  "Sintomi (SAMPLE)": ChecklistIcon,
  "Monitoraggio parametri": TimelineIcon,
  Anamnesi: HistoryEduIcon,
  "Terapia domiciliare": HomeIcon,
  Allergie: WarningAmberIcon,
  "Terapia somministrata": VaccinesIcon,
  "Diario clinico": EditNoteIcon,
  "Conclusioni e indicazioni": AssignmentTurnedInIcon,
  Esito: FlagIcon,
};

export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const Icon = SECTION_ICON[title] ?? DescriptionIcon;
  return (
    <Paper
      component="section"
      elevation={1}
      sx={{
        mb: 2.5,
        p: { xs: 2, sm: 3 },
        breakInside: "avoid",
        // In stampa: niente ombra, bordo sottile per delimitare le sezioni.
        "@media print": { boxShadow: "none", border: 1, borderColor: "divider" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            flexShrink: 0,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Typography variant="h2" sx={{ m: 0 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}
