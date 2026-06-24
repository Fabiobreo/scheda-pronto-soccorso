"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SchedaUpdateInput } from "@/lib/schemas/scheda";
import type { SchedaListParams, SchedaListResult } from "@/lib/schedaQueries";

export const SCHEDE_KEY = ["schede"] as const;

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Errore ${res.status}`;
  } catch {
    return `Errore ${res.status}`;
  }
}

// Serializza i parametri di lista in querystring (omette i vuoti).
export function schedaParamsToSearch(params: SchedaListParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.page !== 1) sp.set("page", String(params.page));
  if (params.pageSize !== 20) sp.set("pageSize", String(params.pageSize));
  if (params.sort !== "updatedAt") sp.set("sort", params.sort);
  if (params.dir !== "desc") sp.set("dir", params.dir);
  return sp.toString();
}

async function fetchSchede(params: SchedaListParams): Promise<SchedaListResult> {
  const qs = schedaParamsToSearch(params);
  const res = await fetch(`/api/schede${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export function useSchede(params: SchedaListParams, initialData?: SchedaListResult) {
  return useQuery({
    queryKey: [...SCHEDE_KEY, params],
    queryFn: () => fetchSchede(params),
    initialData,
    placeholderData: (prev) => prev, // mantiene i dati precedenti durante il cambio pagina
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

const RETRY_DELAYS_MS = [400, 1200]; // backoff per errori di RETE (non per gli HTTP error)

export function useUpdateScheda(id: string) {
  return useMutation({
    mutationFn: async (payload: SchedaUpdateInput): Promise<{ updatedAt: string }> => {
      // Ritenta solo se `fetch` stesso fallisce (rete assente/instabile): una risposta
      // HTTP di errore (4xx/5xx) NON va ritentata, è una decisione del server.
      let lastNetworkError: unknown;
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        let res: Response;
        try {
          res = await fetch(`/api/schede/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          lastNetworkError = err;
          const delay = RETRY_DELAYS_MS[attempt];
          if (delay === undefined) break;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (!res.ok) throw new Error(await readError(res));
        return res.json();
      }
      throw new Error(
        lastNetworkError instanceof Error
          ? `Connessione non disponibile: ${lastNetworkError.message}`
          : "Connessione non disponibile"
      );
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

export const TRASH_KEY = ["schede", "trash"] as const;

// Ripristina una scheda dal cestino (ADMIN).
export function useRestoreScheda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/schede/${id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SCHEDE_KEY });
      qc.invalidateQueries({ queryKey: TRASH_KEY });
    },
  });
}

// Eliminazione definitiva di una scheda dal cestino (ADMIN).
export function usePurgeScheda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/schede/${id}?purge=1`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRASH_KEY }),
  });
}
