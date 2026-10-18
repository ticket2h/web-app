import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocaleProvider, ThemeProvider, Toaster, TooltipProvider, vi } from 'momi-ui'
import { useState, type ReactNode } from 'react'

import { ApiError } from '../shared/api/problem'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Lỗi 4xx (sai quyền, không tồn tại...) gọi lại cũng vậy; chỉ thử lại lỗi mạng và 5xx
        retry: (failureCount, error) =>
          failureCount < 2 && !(error instanceof ApiError && error.status < 500),
      },
    },
  })
}

/** Provider dùng chung cho cả app (theo skills/momi-ui/examples/app-root.tsx). */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ThemeProvider defaultTheme="system">
      <LocaleProvider locale="vi-VN" messages={vi}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
