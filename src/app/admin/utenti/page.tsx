import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import TopBar from "@/components/TopBar";
import UsersManager from "@/components/admin/UsersManager";
import { auth } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { db } from "@/lib/db";
import type { UserListItem } from "@/hooks/useUsers";

export const dynamic = "force-dynamic";

export default async function UtentiPage() {
  const session = await auth();
  // Difesa in profondità: il middleware blocca i non-loggati, qui si verifica il ruolo.
  if (!hasMinRole(session?.user?.role, "ADMIN")) redirect("/");

  const rows = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      disabled: true,
      forcePasswordChange: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const users: UserListItem[] = rows.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <UsersManager initialUsers={users} currentUserId={session!.user.id} />
      </Container>
    </>
  );
}
