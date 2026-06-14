import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

interface ProvidersOptions {
  /** initial entry for the router (defaults to '/'). */
  initialEntries?: string[]
  /** pre-built QueryClient — useful when you want to seed data with setQueryData() */
  queryClient?: QueryClient
}

/**
 * Build a fresh QueryClient with retries disabled — keeps test runs fast and deterministic.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function allProviders({
  children,
  initialEntries = ['/'],
  queryClient,
}: ProvidersOptions & { children: ReactNode }) {
  const client = queryClient ?? makeQueryClient()
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

/**
 * render() drop-in that wraps the tree with QueryClient + MemoryRouter providers.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
  const { initialEntries, queryClient, ...rest } = options
  return render(ui, {
    wrapper: ({ children }) => allProviders({ children, initialEntries, queryClient }),
    ...rest,
  })
}

export { fireEvent, screen, waitFor } from '@testing-library/react'
