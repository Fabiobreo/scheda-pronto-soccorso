import Chip from "@mui/material/Chip";
import type { SchedaStatus } from "@prisma/client";

export default function StatusChip({ status }: { status: SchedaStatus }) {
  const isCompleted = status === "COMPLETED";
  return (
    <Chip
      size="small"
      label={isCompleted ? "Completata" : "Bozza"}
      color={isCompleted ? "success" : "warning"}
      variant={isCompleted ? "filled" : "outlined"}
    />
  );
}
