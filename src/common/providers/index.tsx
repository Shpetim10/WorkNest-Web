'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';
import { toast } from 'sonner';

type ErrorWithResponseMessage = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

/**
 * Common Providers for the application
 * Includes React Query and potentially Auth, Theme, etc.
 */
export function Providers({ children }: { children: ReactNode }) {
  // Use state to ensure stable QueryClient instance during hydration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;

            const apiError = error as ErrorWithResponseMessage;
            let errorMessage = 'Failed to fetch data';
            if (apiError?.response?.data?.message) {
              errorMessage = apiError.response.data.message;
            }

            // Only show errors for queries, not loading/success to avoid spam
            toast.error(errorMessage);
          }
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1, // Only one retry for failures
            refetchOnWindowFocus: false, // Prevents aggressive refetches on focus
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
