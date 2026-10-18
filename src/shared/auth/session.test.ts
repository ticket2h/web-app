import { describe, expect, it, vi } from 'vitest'

import type { LoginResponse } from '../api/types'
import { getAccessToken, getSession, logout, refreshSession, startSession } from './session'

const user = {
  id: '0b000000-0000-4000-8000-000000000004',
  email: 'buyer1@test.local',
  fullName: 'Buyer 1',
  role: 'CUSTOMER',
  organizerId: null,
} as const

function login(accessToken: string, expiresIn = 3600): LoginResponse {
  return { accessToken, tokenType: 'Bearer', expiresIn, user }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('session', () => {
  it('returns no token and does not call refresh for a guest', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')

    expect(await getAccessToken()).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the stored token while it is fresh', async () => {
    startSession(login('t1'), 0)

    expect(await getAccessToken(60_000)).toBe('t1')
  })

  it('refreshes a token that is about to expire', async () => {
    startSession(login('old', 60), 0)
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(login('new')))

    expect(await getAccessToken(45_000)).toBe('new')
    expect(fetch).toHaveBeenCalledWith('/api/identity/auth/refresh', expect.objectContaining({ method: 'POST' }))
  })

  it('shares one refresh request between concurrent callers', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(login('new')))

    const [a, b] = await Promise.all([refreshSession(), refreshSession()])

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(a?.accessToken).toBe('new')
    expect(b).toBe(a)
  })

  it('ends the session when the refresh cookie is rejected', async () => {
    startSession(login('old', 1), 0)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 401, code: 'UNAUTHENTICATED' }, 401))

    expect(await getAccessToken(10_000)).toBeNull()
    expect(getSession()).toBeNull()
  })

  it('clears the session on logout even if the server call fails', async () => {
    startSession(login('t1'))
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))

    await expect(logout()).rejects.toThrow('offline')
    expect(getSession()).toBeNull()
  })
})
