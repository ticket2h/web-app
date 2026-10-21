import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'
import { signIn } from '../../test/session'

const EVENT_ID = 'e0000000-0000-4000-8000-000000000001'
const BASE = `/api/core/organizer/events/${EVENT_ID}`

function detail(status = 'PUBLISHED', ticketTypes: unknown[] = []) {
  return {
    event: {
      id: EVENT_ID,
      venueId: 'v1',
      title: 'Đại nhạc hội',
      description: '',
      timeZone: 'Asia/Ho_Chi_Minh',
      startsAt: '2099-12-20T12:00:00Z',
      saleOpensAt: '2099-11-01T02:00:00Z',
      saleClosesAt: '2099-12-20T11:00:00Z',
      maxTicketsPerUser: 4,
      status,
    },
    ticketTypes,
    staffUserIds: [],
  }
}

function report(groupBy: string, rows: unknown[], sort = 'KEY', direction = 'ASC') {
  return {
    eventId: EVENT_ID,
    timeZone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    groupBy,
    sort,
    direction,
    from: null,
    to: null,
    totals: { orders: 3, tickets: 7, revenue: 5_600_000 },
    rows,
  }
}

const day = (key: string, revenue: number) => ({ key, label: null, orders: 1, tickets: 2, revenue })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Doanh thu', () => {
  it('shows totals, a daily chart and a table sorted on the server', async () => {
    signIn('ORGANIZER')
    const queries: string[] = []
    mockApi({
      [`GET ${BASE}`]: () => json(detail()),
      [`GET ${BASE}/sales`]: (request) => {
        const params = new URL(request.url).searchParams
        queries.push(params.toString())
        return params.get('sort') === 'REVENUE'
          ? json(report('DAY', [day('2099-11-03', 4_000_000), day('2099-11-01', 1_600_000)], 'REVENUE', 'DESC'))
          : json(report('DAY', [day('2099-11-01', 1_600_000), day('2099-11-03', 4_000_000)]))
      },
    })
    renderApp(`/organizer/events/${EVENT_ID}?tab=sales`)

    expect((await screen.findAllByText('5.600.000 ₫'))[0]).toBeInTheDocument()   // thẻ tổng và dòng tổng của bảng
    expect(screen.getByText('Vé đã bán').nextSibling).toHaveTextContent('7')
    expect(screen.getByRole('group', { name: /Doanh thu theo ngày, 3 ngày/ })).toBeInTheDocument()   // có ngày 02/11 trống
    const table = screen.getByRole('region', { name: 'Doanh thu theo ngày' })
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('CN, 01/11/2099')
    expect(queries[0]).toBe('groupBy=DAY')

    await userEvent.click(within(table).getByRole('button', { name: /Doanh thu/ }))

    await waitFor(() => expect(queries.at(-1)).toBe('groupBy=DAY&sort=REVENUE&direction=ASC'))
  })

  it('keyboard users step through the days of the chart', async () => {
    signIn('ORGANIZER')
    mockApi({
      [`GET ${BASE}`]: () => json(detail()),
      [`GET ${BASE}/sales`]: () => json(report('DAY', [day('2099-11-01', 1_600_000), day('2099-11-02', 4_000_000)])),
    })
    renderApp(`/organizer/events/${EVENT_ID}?tab=sales`)

    const chart = await screen.findByRole('group', { name: /Doanh thu theo ngày/ })
    chart.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')

    // formatVnd dùng khoảng trắng không ngắt dòng trước ₫
    expect(await screen.findByText(/^T2, 02\/11\/2099: 4\.000\.000\s₫, 2 vé, 1 đơn$/)).toBeInTheDocument()
  })

  it('switches grouping through the URL', async () => {
    signIn('ORGANIZER')
    const groups: (string | null)[] = []
    mockApi({
      [`GET ${BASE}`]: () => json(detail()),
      [`GET ${BASE}/sales`]: (request) => {
        const groupBy = new URL(request.url).searchParams.get('groupBy')
        groups.push(groupBy)
        return groupBy === 'CHANNEL'
          ? json(report('CHANNEL', [{ key: 'MOBILE_APP', label: null, orders: 1, tickets: 3, revenue: 2_400_000 },
              { key: 'WEB', label: null, orders: 2, tickets: 4, revenue: 3_200_000 }], 'REVENUE', 'DESC'))
          : json(report('DAY', [day('2099-11-01', 5_600_000)]))
      },
    })
    const { router } = renderApp(`/organizer/events/${EVENT_ID}?tab=sales`)

    await screen.findByRole('group', { name: /Doanh thu theo ngày/ })
    await userEvent.click(screen.getByRole('radio', { name: 'Theo kênh bán' }))

    const table = await screen.findByRole('region', { name: 'Doanh thu theo kênh bán' })
    expect(within(table).getByText('Ứng dụng di động')).toBeInTheDocument()
    expect(within(table).getByText('42,9%')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?tab=sales&group=CHANNEL')
    expect(groups).toEqual(['DAY', 'CHANNEL'])
  })
})

describe('Đơn hàng', () => {
  it('lists orders with the buyer and loads more with the cursor', async () => {
    signIn('ORGANIZER')
    const requests: string[] = []
    const order = (n: number, buyer: unknown) => ({
      orderId: `0${n}000000-0000-4000-8000-000000000000`,
      status: 'FULFILLED',
      salesChannel: n % 2 ? 'WEB' : 'MOBILE_APP',
      totalAmount: 1_600_000,
      tickets: 2,
      createdAt: '2099-11-01T03:00:00Z',
      paidAt: '2099-11-01T03:02:00Z',
      buyer,
    })
    mockApi({
      [`GET ${BASE}`]: () => json(detail()),
      [`GET ${BASE}/orders`]: (request) => {
        const params = new URL(request.url).searchParams
        requests.push(params.toString())
        return params.get('cursor')
          ? json({ items: [order(3, null)], limit: 25, nextCursor: null })
          : json({ items: [order(1, { fullName: 'Nguyễn Văn An', email: 'an@test.local' }), order(2, null)], limit: 25,
              nextCursor: 'sau-don-2' })
      },
    })
    renderApp(`/organizer/events/${EVENT_ID}?tab=orders&status=FULFILLED`)

    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('an@test.local')).toBeInTheDocument()
    expect(screen.getByText('Đang xem 2 đơn')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Xem thêm' }))

    expect(await screen.findByText('Đang xem 3 đơn, đã hết danh sách')).toBeInTheDocument()
    expect(screen.getAllByText('Tài khoản không còn')).toHaveLength(2)
    expect(requests).toEqual(['status=FULFILLED&limit=25', 'status=FULFILLED&cursor=sau-don-2&limit=25'])
  })
})

describe('Nhập ghế từ file', () => {
  const vip = { id: 'vip', name: 'VIP', kind: 'SEATED', price: 2000000, totalQuantity: null, availableQuantity: null, seatCount: 0 }

  it('sends the file as text/csv and lists every bad line the server reports', async () => {
    signIn('ORGANIZER')
    let sent: { type: string | null; body: string } | null = null
    mockApi({
      [`GET ${BASE}`]: () => json(detail('DRAFT', [vip])),
      [`POST ${BASE}/seats/import`]: async (request) => {
        sent = { type: request.headers.get('Content-Type'), body: await request.text() }
        return json({
          status: 422,
          code: 'SEAT_IMPORT_INVALID',
          detail: 'File có 2 dòng lỗi, chưa thêm ghế nào',
          errorCount: 2,
          errors: [
            { line: 3, message: 'Trùng ghế với dòng 2' },
            { line: 50001, message: 'Không có loại vé "Hạng Z" trong sự kiện' },
          ],
        }, 422)
      },
    })
    const { container } = renderApp(`/organizer/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Nhập ghế từ file' }))
    const dialog = await screen.findByRole('dialog')
    const csv = 'loai_ve,khu,hang,so_ghe\nVIP,A,1,1\nVIP,A,1,1\n'
    await userEvent.upload(container.ownerDocument.querySelector('input[type=file]')!, new File([csv], 'ghe.csv', { type: 'text/csv' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Nhập ghế' }))

    expect(await within(dialog).findByText('File có 2 dòng lỗi, chưa thêm ghế nào')).toBeInTheDocument()
    const errors = within(dialog).getByRole('region', { name: 'Các dòng lỗi' })
    expect(within(errors).getByText('50001')).toBeInTheDocument()
    expect(within(errors).getByText('Trùng ghế với dòng 2')).toBeInTheDocument()
    expect(sent).toEqual({ type: 'text/csv', body: csv })
  })
})

describe('Xuất file', () => {
  it('downloads the attendee list with the access token and saves it', async () => {
    signIn('ORGANIZER')
    const createObjectURL = vi.fn(() => 'blob:khach')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    let authorization: string | null = null
    mockApi({
      [`GET ${BASE}`]: () => json(detail()),
      [`GET ${BASE}/attendees.csv`]: (request) => {
        authorization = request.headers.get('Authorization')
        return new Response('﻿Mã vé,Loại vé\r\n', {
          headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="danh-sach-khach-e0000000.csv"' },
        })
      },
    })
    renderApp(`/organizer/events/${EVENT_ID}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Xuất file' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Danh sách khách (CSV)' }))

    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(authorization).toBe('Bearer jwt')
    expect(createObjectURL).toHaveBeenCalled()
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('danh-sach-khach-e0000000.csv')
  })
})
