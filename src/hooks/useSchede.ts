"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SchedaUpdateInput } from "@/lib/schemas/scheda";
import type { SchedaListItem } from "@/lib/scheda";

export const SCHEDE_KEY = ["schede"] as const;

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Errore ${res.status}`;
  } catch {
    return `Errore ${res.status}`;
  }
}

async function fetchSchede(): Promise<SchedaListItem[]> {
  const res = await fetch("/api/schede");
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export function useSchede(initialData?: SchedaListItem[]) {
  return useQuery({
    queryKey: SCHEDE_KEY,
    queryFn: fetchSchede,
    initialData,
  });
}

export function useCreateScheda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      const res = await fetch("/api/schede", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDE_KEY }),
  });
}

export function useUpdateScheda(id: string) {
  return useMutation({
    mutationFn: async (payload: SchedaUpdateInput): Promise<{ updatedAt: string }> => {
      const res = await fetch(`/api/schede/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
  });
}

export function useDeleteScheda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/schede/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDE_KEY }),
  });
}
