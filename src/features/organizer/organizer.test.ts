import { describe, expect, it } from 'vitest'

import type { OrganizerEventDetail } from '../../shared/api/types'
import { eventFormSchema, formDefaults, fromIso, toEventRequest } from './eventForm'
import { gridRows, publishChecklist, rowLabels, seatTotal } from './seating'

describe('rowLabels', () => {
  it('expands letters and numbers', () => {
    expect(rowLabels('a', 'E')).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(rowLabels('1', '3')).toEqual(['1', '2', '3'])
  })

  it('rejects mixed or reversed ranges', () => {
    expect(rowLabels('A', '3')).toEqual([])
    expect(rowLabels('E', 'A')).toEqual([])
  })
})

describe('gridRows', () => {
  it('builds a rectangle of seats', () => {
    const rows = gridRows('A', 'C', 1, 12)
    expect(rows).toEqual([
      { label: 'A', from: 1, to: 12 },
      { label: 'B', from: 1, to: 12 },
      { label: 'C', from: 1, to: 12 },
    ])
    expect(seatTotal(rows)).toBe(36)
  })

  it('needs a valid seat range', () => {
    expect(gridRows('A', 'C', 5, 2)).toEqual([])
  })
})

const tz = 'Asia/Ho_Chi_Minh'
const valid = {
  venueId: 'v1',
  title: '  Đêm nhạc  ',
  description: '',
  startsAt: fromIso('2026-12-20T13:00:00Z', tz),
  saleOpensAt: fromIso('2026-11-01T02:00:00Z', tz),
  saleClosesAt: fromIso('2026-12-20T11:00:00Z', tz),
  maxTicketsPerUser: 4,
}

describe('event form', () => {
  it('round-trips times in the event time zone', () => {
    expect(fromIso('2026-12-20T13:00:00Z', tz).time).toBe('20:00')
    expect(toEventRequest(eventFormSchema(tz).parse(valid), tz)).toEqual({
      venueId: 'v1',
      title: 'Đêm nhạc',
      description: undefined,
      startsAt: '2026-12-20T13:00:00.000Z',
      saleOpensAt: '2026-11-01T02:00:00.000Z',
      saleClosesAt: '2026-12-20T11:00:00.000Z',
      maxTicketsPerUser: 4,
    })
  })

  it('requires the sale to close by the start time and after it opens', () => {
    const late = eventFormSchema(tz).safeParse({ ...valid, saleClosesAt: fromIso('2026-12-20T14:00:00Z', tz) })
    expect(late.success).toBe(false)
    expect(late.error?.issues[0]?.path).toEqual(['saleClosesAt'])

    const early = eventFormSchema(tz).safeParse({ ...valid, saleClosesAt: fromIso('2026-10-01T00:00:00Z', tz) })
    expect(early.error?.issues.map((i) => i.message)).toContain('Phải sau giờ mở bán')
  })

  it('starts empty for a new event', () => {
    expect(eventFormSchema(tz).safeParse(formDefaults()).success).toBe(false)
  })
})

function detail(overrides: Partial<OrganizerEventDetail> = {}): OrganizerEventDetail {
  return {
    event: {
      id: 'e1',
      venueId: 'v1',
      title: 'X',
      description: '',
      timeZone: tz,
      startsAt: '2099-01-02T00:00:00Z',
      saleOpensAt: '2098-12-01T00:00:00Z',
      saleClosesAt: '2099-01-01T00:00:00Z',
      maxTicketsPerUser: 4,
      status: 'DRAFT',
    },
    ticketTypes: [],
    staffUserIds: [],
    ...overrides,
  }
}

describe('publishChecklist', () => {
  it('flags a missing ticket type and seated types without seats', () => {
    expect(publishChecklist(detail()).map((i) => i.ok)).toEqual([false, true, true])
    const seatedEmpty = detail({
      ticketTypes: [
        { id: 't', name: 'VIP', kind: 'SEATED', price: 1, totalQuantity: null, availableQuantity: null, seatCount: 0 },
      ],
    })
    expect(publishChecklist(seatedEmpty).map((i) => i.ok)).toEqual([true, false, true])
  })

  it('flags a sale window that already ended', () => {
    expect(publishChecklist(detail(), new Date('2099-06-01').getTime())[2]!.ok).toBe(false)
  })
})
