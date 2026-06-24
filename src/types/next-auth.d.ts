import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augmentazione dei tipi Auth.js: aggiungiamo `id` e `role` alla sessione e al JWT.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// `next-auth/jwt` è solo un re-export di `@auth/core/jwt`: per far MERGE l'augmentazione
// con l'interfaccia usata dai callback bisogna dichiarare il modulo originale.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
