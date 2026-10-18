import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'

import { AppProviders } from '../app/providers'
import { routes } from '../app/router'

/** Vẽ cả app (provider + router thật) ở `path`. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...view, router }
}

type Handler = (request: Request) => Response | Promise<Response>

/** Giả lập BE: chọn handler theo "METHOD /đường/dẫn" (không gồm query). Request không khớp thì 404. */
export function mockApi(handlers: Record<string, Handler>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), location.origin), init)
    const key = `${request.method} ${new URL(request.url).pathname}`
    const handler = handlers[key]
    return handler ? handler(request) : json({ status: 404, code: 'NOT_FOUND' }, 404)
  })
}

export function json(body: unknown, status = 200) {
  const type = status >= 400 ? 'application/problem+json' : 'application/json'
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } })
}
