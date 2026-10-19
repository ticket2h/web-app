import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { json, mockApi, renderApp } from '../../test/render'

function event(id: number, title: string) {
  return {
    id: `00000000-0000-4000-8000-00000000000${id}`,
    title,
    startsAt: '2026-12-20T13:00:00Z',
    timeZone: 'Asia/Ho_Chi_Minh',
    saleOpensAt: '2026-01-01T00:00:00Z',
    saleClosesAt: '2099-12-20T11:00:00Z',
    venueName: 'Sân vận động Mỹ Đình',
    city: 'Hà Nội',
  }
}

describe('EventsPage', () => {
  it('lists published events', async () => {
    mockApi({
      'GET /api/core/events': () =>
        json({ items: [event(1, 'Sơn Tùng M-TP Live Concert 2026')], page: 0, size: 12, total: 1 }),
    })
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Sơn Tùng M-TP Live Concert 2026' })).toBeInTheDocument()
    expect(screen.getByText('1 sự kiện')).toBeInTheDocument()
    expect(screen.getByText('Đang mở bán')).toBeInTheDocument()
    expect(screen.getByText(/Sân vận động Mỹ Đình · Hà Nội/)).toBeInTheDocument()
  })

  it('searches after the user stops typing and keeps the query in the URL', async () => {
    const queries: (string | null)[] = []
    mockApi({
      'GET /api/core/events': (request) => {
        const q = new URL(request.url).searchParams.get('q')
        queries.push(q)
        const items = q === 'son tung' ? [event(1, 'Sơn Tùng M-TP Live Concert 2026')] : []
        return json({ items, page: 0, size: 12, total: items.length })
      },
    })
    const { router } = renderApp('/')
    await screen.findByText('Chưa có sự kiện nào đang mở')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Tìm sự kiện' }), 'son tung')

    expect(await screen.findByRole('heading', { name: 'Sơn Tùng M-TP Live Concert 2026' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?q=son+tung')
    // Một lần lúc mở trang, một lần sau khi gõ xong: không gọi API mỗi phím
    expect(queries).toEqual([null, 'son tung'])
  })

  it('shows the API error with a retry button', async () => {
    let calls = 0
    mockApi({
      'GET /api/core/events': () => {
        calls += 1
        return calls === 1
          ? json({ status: 400, code: 'VALIDATION_FAILED', detail: 'Tham số không hợp lệ' }, 400)
          : json({ items: [event(2, 'Đen Vâu Show')], page: 0, size: 12, total: 1 })
      },
    })
    renderApp('/')

    expect(await screen.findByText('Tham số không hợp lệ')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Đen Vâu Show' })).toBeInTheDocument())
  })
})
