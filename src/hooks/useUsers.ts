"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@prisma/client";
import type { UserCreateInput, UserUpdateInput } from "@/lib/schemas/user";

export const USERS_KEY = ["users"] as const;

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Errore ${res.status}`;
  } catch {
    return `Errore ${res.status}`;
  }
}

async function fetchUsers(): Promise<UserListItem[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export function useUsers(initialData?: UserListItem[]) {
  return useQuery({ queryKey: USERS_KEY, queryFn: fetchUsers, initialData });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UserCreateInput): Promise<UserListItem> => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UserUpdateInput;
    }): Promise<UserListItem> => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
