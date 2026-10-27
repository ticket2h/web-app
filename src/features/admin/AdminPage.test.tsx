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
          limit: 20,
          nextCursor: null,
        })
      },
      'POST /api/identity/admin/users': async (request) => {
        created = await request.json()
        return json({ id: 'u2', email: 'btc@test.local', fullName: 'BTC Mới', role: 'ORGANIZER', organizerId: sky.id }, 201)
      },
    })
    renderApp('/admin?role=STAFF&q=staff')

    expect(await screen.findByText('staff1@test.local')).toBeInTheDocument()
    expect(queries[0]).toBe('?role=STAFF&q=staff&limit=20')
    expect(screen.getByText('Đang xem 1 tài khoản, đã hết danh sách')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeInTheDocument()

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

  it('loads the next page with the cursor of the previous one', async () => {
    signIn('ADMIN')
    const cursors: (string | null)[] = []
    const user = (n: number) => ({ id: `u${n}`, email: `u${n}@test.local`, fullName: `Khách ${n}`, role: 'CUSTOMER', organizerId: null })
    mockApi({
      'GET /api/identity/admin/organizers': () => json([]),
      'GET /api/identity/admin/users': (request) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        return cursor === null
          ? json({ items: [user(1), user(2)], limit: 20, nextCursor: 'trang-2' })
          : json({ items: [user(3)], limit: 20, nextCursor: null })
      },
    })
    renderApp('/admin')

    expect(await screen.findByText('u2@test.local')).toBeInTheDocument()
    expect(screen.getByText('Đang xem 2 tài khoản')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))

    expect(await screen.findByText('u3@test.local')).toBeInTheDocument()
    expect(screen.getByText('u1@test.local')).toBeInTheDocument()
    expect(cursors).toEqual([null, 'trang-2'])
    expect(screen.getByText('Đang xem 3 tài khoản, đã hết danh sách')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeInTheDocument()
  })
})

describe('AdminPage: lịch sử thao tác', () => {
  const priceChange = {
    id: 'a1',
    occurredAt: '2026-11-01T12:00:00Z',
    actor: { type: 'USER', id: 'u1', role: 'ORGANIZER', name: null, email: 'organizer1@test.local', fullName: 'BTC Sky' },
    action: 'TICKET_TYPE_PRICE_CHANGED',
    targetType: 'TICKET_TYPE',
    targetId: 't1',
    organizerId: 'o1',
    eventId: 'e1',
    details: { name: 'VIP', from: 1500000, to: 1800000 },
  }
  const refund = {
    id: 'a2',
    occurredAt: '2026-11-01T11:00:00Z',
    actor: { type: 'SYSTEM', id: null, role: null, name: 'refund-job', email: null, fullName: null },
    action: 'PAYMENT_REFUNDED',
    targetType: 'PAYMENT',
    targetId: 'p1',
    organizerId: null,
    eventId: 'e1',
    details: { amount: 500000 },
  }

  it('lists core history with readable labels and loads more with the cursor', async () => {
    signIn('ADMIN')
    const queries: string[] = []
    mockApi({
      'GET /api/core/admin/audit-logs': (request) => {
        const search = new URL(request.url).search
        queries.push(search)
        return search.includes('cursor=')
          ? json({ items: [refund], limit: 50, nextCursor: null })
          : json({ items: [priceChange], limit: 50, nextCursor: 'c1' })
      },
    })
    renderApp('/admin?tab=audit')

    expect(await screen.findByText('organizer1@test.local')).toBeInTheDocument()
    expect(screen.getByText('Đổi giá vé', { selector: '[data-slot=badge]' })).toBeInTheDocument()
    expect(screen.getByText(/VIP: 1\.500\.000.*→ 1\.800\.000/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))

    expect(await screen.findByText('Job hoàn tiền')).toBeInTheDocument()
    expect(queries).toEqual(['?limit=50', '?cursor=c1&limit=50'])
    expect(screen.getByText('Đang xem 2 thao tác, đã hết lịch sử')).toBeInTheDocument()
  })

  it('switches to identity history and filters by action from the URL', async () => {
    signIn('ADMIN')
    const queries: string[] = []
    mockApi({
      'GET /api/identity/admin/audit-logs': (request) => {
        queries.push(new URL(request.url).search)
        return json({
          items: [
            {
              id: 'a3',
              occurredAt: '2026-11-01T10:00:00Z',
              actor: { type: 'SYSTEM', id: null, role: null, name: 'refresh-token', email: null, fullName: null },
              action: 'REFRESH_TOKEN_REUSE_DETECTED',
              targetType: 'USER',
              targetId: 'u9',
              targetEmail: 'buyer1@test.local',
              details: { familyId: 'f1', revokedTokens: 2 },
            },
          ],
          limit: 50,
          nextCursor: null,
        })
      },
    })
    renderApp('/admin?tab=audit&source=identity&action=REFRESH_TOKEN_REUSE_DETECTED')

    expect(await screen.findByText('buyer1@test.local')).toBeInTheDocument()
    expect(screen.getByText(/Thu hồi 2 token/)).toBeInTheDocument()
    expect(queries[0]).toBe('?limit=50&action=REFRESH_TOKEN_REUSE_DETECTED')
  })
})
