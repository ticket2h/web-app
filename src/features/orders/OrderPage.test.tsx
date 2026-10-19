import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

vi.mock('../../shared/navigation', () => ({ goToExternal: vi.fn() }))
const { goToExternal } = await import('../../shared/navigation')

const EVENT_ID = '8eaa9135-7daf-4b95-b486-8efdfd79b0be'
const ORDER_ID = '000702e4-0f86-4c70-9b59-9cc5e38644f0'

function order(status: string) {
  return {
    orderId: ORDER_ID,
    eventId: EVENT_ID,
    status,
    totalAmount: 1600000,
    currency: 'VND',
    expiresAt: new Date(Date.now() + 9 * 60_000).toISOString(),
    paidAt: status === 'PENDING_PAYMENT' ? null : '2026-10-19T07:00:00Z',
    items: [{ ticketTypeId: 'ga', seatId: null, quantity: 2, unitPrice: 800000 }],
  }
}

const event = {
  id: EVENT_ID,
  title: 'Sơn Tùng M-TP Live Concert 2026',
  description: '',
  timeZone: 'Asia/Ho_Chi_Minh',
  startsAt: '2099-12-20T13:00:00Z',
  saleOpensAt: '2000-01-01T00:00:00Z',
  saleClosesAt: '2099-12-20T11:00:00Z',
  maxTicketsPerUser: 4,
  onSale: true,
  venue: { name: 'Mỹ Đình', address: 'Lê Đức Thọ', city: 'Hà Nội' },
  ticketTypes: [{ id: 'ga', name: 'Vé đứng', kind: 'GA', price: 800000, available: 10 }],
}

describe('OrderPage', () => {
  it('shows the hold countdown and sends the browser to MockPay', async () => {
    signIn()
    mockApi({
      [`GET /api/core/orders/${ORDER_ID}`]: () => json(order('PENDING_PAYMENT')),
      [`GET /api/core/events/${EVENT_ID}`]: () => json(event),
      [`POST /api/core/orders/${ORDER_ID}/payments`]: () =>
        json({ paymentId: 'p1', orderId: ORDER_ID, status: 'INITIATED', amount: 1600000, currency: 'VND', gatewayPaymentId: 'mp_1', paymentUrl: 'http://localhost:9090/pay/mp_1', expiresAt: '2099-01-01T00:00:00Z' }, 201),
    })
    renderApp(`/orders/${ORDER_ID}`)

    expect(await screen.findByRole('timer')).toHaveTextContent(/^0[89]:\d\d$/)
    expect(await screen.findByText('Vé đứng × 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Thanh toán/ }))
    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('http://localhost:9090/pay/mp_1'))
  })

  it('explains a payment that hit the attempt limit', async () => {
    signIn()
    mockApi({
      [`GET /api/core/orders/${ORDER_ID}`]: () => json(order('PENDING_PAYMENT')),
      [`GET /api/core/events/${EVENT_ID}`]: () => json(event),
      [`POST /api/core/orders/${ORDER_ID}/payments`]: () =>
        json({ status: 409, code: 'PAYMENT_ATTEMPTS_EXCEEDED', detail: 'x' }, 409),
    })
    renderApp(`/orders/${ORDER_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: /Thanh toán/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('quá số lần thanh toán')
  })

  it('keeps asking until the webhook marks the order paid, then links to the tickets', async () => {
    signIn()
    let calls = 0
    mockApi({
      [`GET /api/core/orders/${ORDER_ID}`]: () => json(order(++calls < 2 ? 'PENDING_PAYMENT' : 'FULFILLED')),
      [`GET /api/core/events/${EVENT_ID}`]: () => json(event),
    })
    renderApp(`/payments/return?orderId=${ORDER_ID}&merchantRef=p1&status=SUCCESS`)

    expect(await screen.findByText('Đang chờ MockPay xác nhận thanh toán')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Xem vé' }, { timeout: 4000 })).toHaveAttribute(
      'href',
      `/me/tickets?order=${ORDER_ID}`,
    )
  })
})
