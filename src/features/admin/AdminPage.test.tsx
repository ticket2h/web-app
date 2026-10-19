import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

const sky = { id: '0a000000-0000-4000-8000-000000000001', name: 'Sky Music' }

describe('AdminPage', () => {
  it('filters accounts from the URL and creates an organizer account for a chosen organizer', async () => {
    signIn('ADMIN')
    const queries: string[] = []
    let created: unknown
    mockApi({
      'GET /api/identity/admin/organizers': () => json([sky]),
      'GET /api/identity/admin/users': (request) => {
        queries.push(new URL(request.url).search)
        return json({
          items: [{ id: 'u1', email: 'staff1@test.local', fullName: 'Nhân viên 1', role: 'STAFF', organizerId: null }],
          page: 0,
          size: 20,
          total: 1,
        })
      },
      'POST /api/identity/admin/users': async (request) => {
        created = await request.json()
        return json({ id: 'u2', email: 'btc@test.local', fullName: 'BTC Mới', role: 'ORGANIZER', organizerId: sky.id }, 201)
      },
    })
    renderApp('/admin?role=STAFF&q=staff')

    expect(await screen.findByText('staff1@test.local')).toBeInTheDocument()
    expect(queries[0]).toBe('?role=STAFF&q=staff&page=0&size=20')

    await userEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/Họ tên/), 'BTC Mới')
    await userEvent.type(within(dialog).getByLabelText(/Email/), 'btc@test.local')
    await userEvent.type(within(dialog).getByLabelText(/Mật khẩu/), 'Passw0rd!')
    await userEvent.selectOptions(within(dialog).getByLabelText(/Vai trò/), 'ORGANIZER')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))
    // Vai trò ban tổ chức bắt buộc chọn ban tổ chức ("Chọn ban tổ chức" vừa là lỗi vừa là dòng gợi ý của ô chọn)
    await waitFor(() => expect(within(dialog).getByLabelText(/Ban tổ chức/)).toHaveAttribute('aria-invalid', 'true'))
    expect(created).toBeUndefined()

    await userEvent.selectOptions(within(dialog).getByLabelText(/Ban tổ chức/), sky.id)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))
    await waitFor(() =>
      expect(created).toEqual({
        fullName: 'BTC Mới',
        email: 'btc@test.local',
        password: 'Passw0rd!',
        role: 'ORGANIZER',
        organizerId: sky.id,
      }),
    )
  })
})
