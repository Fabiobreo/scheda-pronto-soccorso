// Seed idempotente del primo utente ADMIN.
//
// Legge SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD dall'ambiente. Esegui con:
//   npx prisma db seed
// (la voce "prisma.seed" in package.json punta a questo file via tsx).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", disabled: false },
    create: { email, name: "Amministratore", passwordHash, role: "ADMIN" },
  });

  console.log(`Seed admin pronto: ${user.email} (ruolo ${user.role})`);
  if (password === "changeme") {
    console.warn("⚠  Password di default 'changeme': cambiala al primo accesso.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
