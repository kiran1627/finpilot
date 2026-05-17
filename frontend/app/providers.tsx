"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-1)",
              color: "var(--ink-1)",
              border: "1px solid var(--surface-3)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
