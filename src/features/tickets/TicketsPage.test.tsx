import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

const EVENT_ID = '8eaa9135-7daf-4b95-b486-8efdfd79b0be'

function ticket(id: string, seat: string | null, status = 'VALID') {
  return {
    ticketId: id,
    orderId: 'o1',
    eventId: EVENT_ID,
    eventTitle: 'Sơn Tùng M-TP Live Concert 2026',
    eventStartsAt: '2099-12-20T13:00:00Z',
    ticketType: seat ? 'VIP' : 'GA',
    seat,
    status,
    issuedAt: '2026-10-19T07:00:00Z',
    checkedInAt: null,
    checkedInGate: null,
  }
}

describe('TicketsPage', () => {
  it('groups tickets by event and transfers one by email', async () => {
    signIn()
    let transferred: unknown
    mockApi({
      'GET /api/core/me/tickets': () => json([ticket('t1', 'A-5'), ticket('t2', null)]),
      [`GET /api/core/events/${EVENT_ID}`]: () => json({}, 404),
      'GET /api/core/tickets/t2/qr': () => new Response(new Blob(['png']), { headers: { 'Content-Type': 'image/png' } }),
      'POST /api/core/tickets/t2/transfer': async (request) => {
        transferred = await request.json()
        return json({ status: 404, code: 'RECIPIENT_NOT_FOUND', detail: 'x' }, 404)
      },
    })
    renderApp('/me/tickets')

    expect(await screen.findByRole('heading', { name: 'Sơn Tùng M-TP Live Concert 2026' })).toBeInTheDocument()
    expect(screen.getAllByTestId('ticket')).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Xem vé GA' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Chuyển nhượng' }))
    await userEvent.type(screen.getByLabelText(/Email người nhận/), 'ban@test.local')
    await userEvent.click(screen.getByRole('button', { name: 'Chuyển vé' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Không có tài khoản khách hàng nào với email này')
    expect(transferred).toEqual({ recipientEmail: 'ban@test.local' })
  })
})
