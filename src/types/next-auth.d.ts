import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augmentazione dei tipi Auth.js: aggiungiamo `id` e `role` alla sessione e al JWT.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      forcePasswordChange: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    forcePasswordChange?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    forcePasswordChange?: boolean;
  }
}
