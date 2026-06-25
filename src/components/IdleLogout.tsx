"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

// Logout automatico dopo un periodo di inattività: protegge le postazioni
// condivise dove l'operatore potrebbe allontanarsi lasciando la sessione aperta.
// Resetta il timer a ogni interazione (mouse/tastiera/touch/scroll).
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minuti
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

export default function IdleLogout() {
  const { status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, IDLE_TIMEOUT_MS);
    };

    reset();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, reset, { passive: true });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, reset);
    };
  }, [status]);

  return null;
}
