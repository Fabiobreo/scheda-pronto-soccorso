import { z } from "zod";

// Schemi Zod per l'entità User (gestione utenti lato ADMIN).
// La password viaggia in chiaro solo nel body della richiesta (HTTPS) e viene
// hashata server-side con bcrypt; non è mai esposta in lettura.

export const ROLE_VALUES = ["NURSE", "SUPERVISOR", "ADMIN"] as const;

const emailSchema = z.string().trim().toLowerCase().email().max(200);
const passwordSchema = z.string().min(8, "La password deve avere almeno 8 caratteri").max(200);

// POST /api/users — crea un utente.
export const UserCreateSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(120).default(""),
  password: passwordSchema,
  role: z.enum(ROLE_VALUES).default("NURSE"),
});
export type UserCreateInput = z.infer<typeof UserCreateSchema>;

// PUT /api/users/[id] — aggiornamento parziale. La password è opzionale (solo se
// la si vuole reimpostare). Almeno un campo presente.
export const UserUpdateSchema = z
  .object({
    name: z.string().trim().max(120),
    password: passwordSchema,
    role: z.enum(ROLE_VALUES),
    disabled: z.boolean(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nessun campo da aggiornare" });
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
