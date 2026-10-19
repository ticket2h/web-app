import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

const EVENT_ID = '8eaa9135-7daf-4b95-b486-8efdfd79b0be'
const ORDER_ID = '000702e4-0f86-4c70-9b59-9cc5e38644f0'

const event = {
  id: EVENT_ID,
  title: 'Sơn Tùng M-TP Live Concert 2026',
  description: 'Đêm nhạc',
  timeZone: 'Asia/Ho_Chi_Minh',
  startsAt: '2099-12-20T13:00:00Z',
  saleOpensAt: '2000-01-01T00:00:00Z',
  saleClosesAt: '2099-12-20T11:00:00Z',
  maxTicketsPerUser: 4,
  onSale: true,
  venue: { name: 'Sân vận động Mỹ Đình', address: 'Lê Đức Thọ', city: 'Hà Nội' },
  ticketTypes: [
    { id: 'vip', name: 'VIP', kind: 'SEATED', price: 1500000, available: 2 },
    { id: 'ga', name: 'GA', kind: 'GA', price: 800000, available: 100 },
  ],
}

const seats = [
  { seatId: 's1', ticketTypeId: 'vip', section: 'VIP', row: 'A', number: 1, status: 'AVAILABLE' },
  { seatId: 's2', ticketTypeId: 'vip', section: 'VIP', row: 'A', number: 2, status: 'AVAILABLE' },
  { seatId: 's3', ticketTypeId: 'vip', section: 'VIP', row: 'A', number: 3, status: 'SOLD' },
]

function api(orders: (request: Request) => Response | Promise<Response>) {
  return mockApi({
    [`GET /api/core/events/${EVENT_ID}`]: () => json(event),
    [`GET /api/core/events/${EVENT_ID}/seats`]: () => json(seats),
    'POST /api/core/orders': orders,
    [`GET /api/core/orders/${ORDER_ID}`]: () =>
      json({ orderId: ORDER_ID, eventId: EVENT_ID, status: 'PENDING_PAYMENT', totalAmount: 2300000, currency: 'VND', expiresAt: '2099-01-01T00:00:00Z', paidAt: null, items: [] }),
  })
}

describe('EventDetailPage', () => {
  it('sends the chosen seats and GA tickets with an Idempotency-Key, then opens the order', async () => {
    signIn('CUSTOMER')
    let body: unknown
    let key: string | null = null
    api(async (request) => {
      body = await request.json()
      key = request.headers.get('Idempotency-Key')
      return json({ orderId: ORDER_ID }, 201)
    })
    const { router } = renderApp(`/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: /VIP · Hàng A · Ghế 1,/ }))
    expect(screen.getByRole('button', { name: /VIP · Hàng A · Ghế 3,/ })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Thêm một vé GA' }))
    expect(screen.getAllByText(/2\.300\.000/).length).toBeGreaterThan(0)
    await userEvent.click(screen.getAllByRole('button', { name: 'Giữ chỗ 2 vé' })[0]!)

    await waitFor(() => expect(router.state.location.pathname).toBe(`/orders/${ORDER_ID}`))
    expect(body).toEqual({
      eventId: EVENT_ID,
      items: [
        { ticketTypeId: 'vip', seatIds: ['s1'] },
        { ticketTypeId: 'ga', quantity: 1 },
      ],
    })
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('drops seats someone else just took and reuses the key only for the same selection', async () => {
    signIn('CUSTOMER')
    const keys: (string | null)[] = []
    api((request) => {
      keys.push(request.headers.get('Idempotency-Key'))
      return json({ status: 409, code: 'SEAT_UNAVAILABLE', detail: 'Có ghế đã được người khác giữ', unavailableSeatIds: ['s2'] }, 409)
    })
    renderApp(`/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: /Ghế 1,/ }))
    await userEvent.click(screen.getByRole('button', { name: /Ghế 2,/ }))
    await userEvent.click(screen.getAllByRole('button', { name: 'Giữ chỗ 2 vé' })[0]!)

    expect(await screen.findByText(/vừa có người giữ/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ghế 2,/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /Ghế 1,/ })).toHaveAttribute('aria-pressed', 'true')

    // Lựa chọn đã đổi (bỏ ghế 2) nên lần đặt sau dùng key mới
    await userEvent.click(screen.getAllByRole('button', { name: 'Giữ chỗ 1 vé' })[0]!)
    await waitFor(() => expect(keys).toHaveLength(2))
    expect(keys[1]).not.toBe(keys[0])
  })

  it('asks guests to sign in and stops non-customers from buying', async () => {
    api(() => json({}, 500))
    renderApp(`/events/${EVENT_ID}`)
    expect((await screen.findAllByRole('link', { name: 'Đăng nhập để đặt vé' }))[0]).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent(`/events/${EVENT_ID}`)}`,
    )
  })

  it('tells staff accounts they cannot buy', async () => {
    signIn('STAFF')
    api(() => json({}, 500))
    renderApp(`/events/${EVENT_ID}`)
    const aside = (await screen.findByText('Vé đã chọn')).closest('div[data-slot=card]') as HTMLElement
    expect(within(aside).getByText('Chỉ tài khoản khách hàng mới đặt được vé')).toBeInTheDocument()
  })
})
