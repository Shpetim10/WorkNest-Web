'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

/**
 * Common Providers for the application
 * Includes React Query and potentially Auth, Theme, etc.
 */
export function Providers({ children }: { children: ReactNode }) {
  // Use state to ensure stable QueryClient instance during hydration
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
