import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Cachea los datos 5 min antes de considerarlos "viejos" y los mantiene
      // 30 min en memoria. Evita recargar todo al cambiar de pestaña.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    },
  },
});