import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

const EVENT_ID = 'e0000000-0000-4000-8000-000000000001'

function detail(ticketTypes: unknown[], status = 'DRAFT') {
  return {
    event: {
      id: EVENT_ID,
      venueId: 'v1',
      title: 'Đêm nhạc',
      description: '',
      timeZone: 'Asia/Ho_Chi_Minh',
      startsAt: '2099-12-20T13:00:00Z',
      saleOpensAt: '2099-11-01T02:00:00Z',
      saleClosesAt: '2099-12-20T11:00:00Z',
      maxTicketsPerUser: 4,
      status,
      waitingRoomAdmitPerSecond: null,
    },
    ticketTypes,
    staffUserIds: [],
  }
}

const vipNoSeats = { id: 'vip', name: 'VIP', kind: 'SEATED', price: 2000000, totalQuantity: null, availableQuantity: null, seatCount: 0 }

describe('OrganizerEventPage', () => {
  it('blocks publishing until every seated type has seats', async () => {
    signIn('ORGANIZER')
    mockApi({ [`GET /api/core/organizer/events/${EVENT_ID}`]: () => json(detail([vipNoSeats])) })
    renderApp(`/organizer/events/${EVENT_ID}`)

    expect(await screen.findByText('Chưa có ghế')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Công bố' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Chưa công bố được')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Công bố' })).toBeDisabled()
  })

  it('adds a seat block and publishes', async () => {
    signIn('ORGANIZER')
    let seated = false
    let published = false
    let seatBody: unknown
    mockApi({
      [`GET /api/core/organizer/events/${EVENT_ID}`]: () =>
        json(detail([{ ...vipNoSeats, seatCount: seated ? 30 : 0 }], published ? 'PUBLISHED' : 'DRAFT')),
      [`POST /api/core/organizer/events/${EVENT_ID}/seats`]: async (request) => {
        seatBody = await request.json()
        seated = true
        return json({ created: 30 }, 201)
      },
      [`POST /api/core/organizer/events/${EVENT_ID}/publish`]: () => {
        published = true
        return json(detail([]).event)
      },
      [`GET /api/core/events/${EVENT_ID}`]: () => json({}, 404),
      [`GET /api/core/events/${EVENT_ID}/seats`]: () => json([]),
    })
    renderApp(`/organizer/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Thêm ghế' }))
    const dialog = await screen.findByRole('dialog')
    const [, , lastRow] = within(dialog).getAllByRole('textbox') // khu, từ hàng, tới hàng
    await userEvent.clear(lastRow!)
    await userEvent.type(lastRow!, 'C')
    const [, seatTo] = within(dialog).getAllByRole('spinbutton') // từ ghế, tới ghế
    await userEvent.clear(seatTo!)
    await userEvent.type(seatTo!, '10')
    expect(within(dialog).getByText('30 ghế')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Thêm 30 ghế' }))

    expect(await screen.findByText('30 ghế')).toBeInTheDocument()
    expect(seatBody).toEqual({
      ticketTypeId: 'vip',
      section: 'A',
      rows: [
        { label: 'A', from: 1, to: 10 },
        { label: 'B', from: 1, to: 10 },
        { label: 'C', from: 1, to: 10 },
      ],
    })

    await userEvent.click(screen.getByRole('button', { name: 'Công bố' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Công bố' }))
    await waitFor(() => expect(published).toBe(true))
    expect(await screen.findByRole('link', { name: 'Xem trang bán vé' })).toBeInTheDocument()
  })

  it('is only for organizer accounts', async () => {
    signIn('CUSTOMER')
    mockApi({})
    renderApp(`/organizer/events/${EVENT_ID}`)
    expect(await screen.findByText('Bạn không có quyền xem trang này')).toBeInTheDocument()
  })
})

describe('OrganizerEventPage: phòng chờ và giá vé', () => {
  const vip = { ...vipNoSeats, seatCount: 50 }

  it('turns the waiting room on with a rate', async () => {
    signIn('ORGANIZER')
    let body: unknown
    mockApi({
      [`GET /api/core/organizer/events/${EVENT_ID}`]: () => json(detail([vip])),
      [`PUT /api/core/organizer/events/${EVENT_ID}/waiting-room`]: async (request) => {
        body = await request.json()
        return json({ ...detail([]).event, waitingRoomAdmitPerSecond: 200 })
      },
    })
    renderApp(`/organizer/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('switch', { name: 'Bật phòng chờ' }))
    expect(screen.getByLabelText('Số người vào mỗi giây')).toHaveValue('100')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(body).toEqual({ admitPerSecond: 100 }))
  })

  it('shows who is waiting while the waiting room is on', async () => {
    signIn('ORGANIZER')
    const published = detail([vip], 'PUBLISHED')
    mockApi({
      [`GET /api/core/organizer/events/${EVENT_ID}`]: () =>
        json({ ...published, event: { ...published.event, waitingRoomAdmitPerSecond: 150 } }),
      [`GET /api/core/organizer/events/${EVENT_ID}/waiting-room`]: () =>
        json({ admitPerSecond: 150, waiting: 4321, admitted: 87 }),
      [`GET /api/core/events/${EVENT_ID}`]: () => json({}, 404),
      [`GET /api/core/events/${EVENT_ID}/seats`]: () => json([]),
    })
    renderApp(`/organizer/events/${EVENT_ID}`)

    expect(await screen.findByText('4.321')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
  })

  it('changes a ticket price even after publishing', async () => {
    signIn('ORGANIZER')
    let body: unknown
    mockApi({
      [`GET /api/core/organizer/events/${EVENT_ID}`]: () => json(detail([vip], 'PUBLISHED')),
      [`PUT /api/core/organizer/events/${EVENT_ID}/ticket-types/vip/price`]: async (request) => {
        body = await request.json()
        return json({ ...vip, price: 2500000 })
      },
      [`GET /api/core/events/${EVENT_ID}`]: () => json({}, 404),
      [`GET /api/core/events/${EVENT_ID}/seats`]: () => json([]),
    })
    renderApp(`/organizer/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Đổi giá' }))
    const dialog = await screen.findByRole('dialog')
    const price = within(dialog).getByLabelText(/Giá mới/)
    await userEvent.clear(price)
    await userEvent.type(price, '2500000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu giá mới' }))

    await waitFor(() => expect(body).toEqual({ price: 2500000 }))
  })
})
