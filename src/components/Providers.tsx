"use client";

import { useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeModeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

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
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeModeProvider>
      </QueryClientProvider>
    </AppRouterCacheProvider>
  );
}
