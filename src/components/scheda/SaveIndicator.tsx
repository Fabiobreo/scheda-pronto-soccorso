import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const CONFIG: Record<SaveStatus, { label: string; color: string }> = {
  idle: { label: "", color: "text.secondary" },
  pending: { label: "Modifiche non salvate…", color: "text.secondary" },
  saving: { label: "Salvataggio…", color: "text.secondary" },
  saved: { label: "Salvato", color: "success.main" },
  error: { label: "Errore di salvataggio", color: "error.main" },
};

export default function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry?: () => void;
}) {
  if (status === "idle") return null;
  const { label, color } = CONFIG[status];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color, minWidth: 180 }}>
      {status === "saving" && <CircularProgress size={14} color="inherit" />}
      {status === "saved" && <CloudDoneIcon fontSize="small" color="inherit" />}
      {status === "error" && <CloudOffIcon fontSize="small" color="inherit" />}
      {status === "pending" && <EditIcon fontSize="small" color="inherit" />}
      <Typography variant="caption" sx={{ color: "inherit" }}>
        {label}
      </Typography>
      {status === "error" && onRetry && (
        <Button
          size="small"
          color="error"
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={onRetry}
          sx={{ minWidth: 0, py: 0 }}
        >
          Riprova
        </Button>
      )}
    </Box>
  );
}
