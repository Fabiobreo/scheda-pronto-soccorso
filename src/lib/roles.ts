import type { Role } from "@prisma/client";

// Gerarchia dei ruoli come livelli numerici: confronto ">=" per i controlli di
// autorizzazione. NURSE è il livello base, ADMIN il massimo.
export const ROLE_LEVEL: Record<Role, number> = {
  NURSE: 1,
  SUPERVISOR: 2,
  ADMIN: 3,
};

// Vero se `role` soddisfa il livello minimo richiesto.
export function hasMinRole(role: Role | null | undefined, min: Role): boolean {
  if (!role) return false;
  return ROLE_LEVEL[role] >= ROLE_LEVEL[min];
}

export const ROLE_LABEL: Record<Role, string> = {
  NURSE: "Infermiere",
  SUPERVISOR: "Responsabile",
  ADMIN: "Amministratore",
};
