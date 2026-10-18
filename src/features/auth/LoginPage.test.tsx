import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getSession } from '../../shared/auth/session'
import { json, mockApi, renderApp } from '../../test/render'

const buyer = {
  id: '0b000000-0000-4000-8000-000000000004',
  email: 'buyer1@test.local',
  fullName: 'Buyer Một',
  role: 'CUSTOMER',
  organizerId: null,
}

describe('LoginPage', () => {
  it('validates the form before calling the API', async () => {
    const fetch = mockApi({})
    renderApp('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Nhập email')).toBeInTheDocument()
    expect(screen.getByText('Nhập mật khẩu')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows a clear message for wrong credentials', async () => {
    mockApi({
      'POST /api/identity/auth/login': () =>
        json({ status: 401, code: 'INVALID_CREDENTIALS', detail: 'Sai email hoặc mật khẩu' }, 401),
    })
    renderApp('/login')

    await userEvent.type(screen.getByLabelText(/Email/), 'buyer1@test.local')
    await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Sai email hoặc mật khẩu')
    expect(getSession()).toBeNull()
  })

  it('signs in and returns to the page in ?next', async () => {
    let sentBody: unknown
    mockApi({
      'POST /api/identity/auth/login': async (request) => {
        sentBody = await request.json()
        return json({ accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 3600, user: buyer })
      },
      'GET /api/identity/me': (request) =>
        request.headers.get('Authorization') === 'Bearer jwt' ? json(buyer) : json({ status: 401 }, 401),
    })
    const { router } = renderApp('/login?next=%2Faccount')

    await userEvent.type(screen.getByLabelText(/Email/), ' buyer1@test.local ')
    await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'Passw0rd!')
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/account'))
    expect(sentBody).toEqual({ email: 'buyer1@test.local', password: 'Passw0rd!' })
    expect(await screen.findByText('buyer1@test.local', { selector: 'dd' })).toBeInTheDocument()
    expect(getSession()?.user.fullName).toBe('Buyer Một')
  })

  it('sends a guest to /login when opening a protected page', async () => {
    mockApi({})
    const { router } = renderApp('/account')

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?next=%2Faccount')
  })
})
