import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // serve cached data for 5 min, refetch in background
      gcTime: 10 * 60 * 1000,      // keep in memory 10 min after unmount
      refetchOnWindowFocus: false,  // don't hammer API on tab switch
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});
