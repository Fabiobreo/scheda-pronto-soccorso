"use client";

import { useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeModeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import IdleLogout from "@/components/IdleLogout";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <SessionProvider>
        <IdleLogout />
        <QueryClientProvider client={queryClient}>
          <ThemeModeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeModeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </AppRouterCacheProvider>
  );
}
