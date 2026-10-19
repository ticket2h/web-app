import { describe, expect, it } from 'vitest'

import type { Seat, TicketTypeView } from '../../shared/api/types'
import { buildOrderRequest, groupSeats, selectionKey, summarize, withoutSeats } from './checkout'

const vip: TicketTypeView = { id: 'vip', name: 'VIP', kind: 'SEATED', price: 1_500_000, available: 3 }
const ga: TicketTypeView = { id: 'ga', name: 'Phổ thông', kind: 'GA', price: 800_000, available: 100 }

function seat(id: string, row: string, number: number, section = 'A'): Seat {
  return { seatId: id, ticketTypeId: 'vip', section, row, number, status: 'AVAILABLE' }
}

const seats = [seat('s1', 'A', 1), seat('s2', 'A', 2), seat('s3', 'B', 10)]
const seatsById = new Map(seats.map((s) => [s.seatId, s]))

describe('summarize', () => {
  it('lists seated and GA lines in ticket type order with the total', () => {
    const result = summarize({ seatIds: ['s2', 's1'], ga: { ga: 3 } }, [vip, ga], seatsById)

    expect(result.count).toBe(5)
    expect(result.total).toBe(2 * 1_500_000 + 3 * 800_000)
    expect(result.lines.map((l) => [l.ticketType.id, l.quantity])).toEqual([
      ['vip', 2],
      ['ga', 3],
    ])
    expect(result.lines[0]!.seats).toEqual(['A · Hàng A · Ghế 2', 'A · Hàng A · Ghế 1'])
  })

  it('skips GA types with zero tickets', () => {
    expect(summarize({ seatIds: [], ga: { ga: 0 } }, [vip, ga], seatsById).lines).toEqual([])
  })
})

describe('buildOrderRequest', () => {
  it('groups seats by ticket type and sends GA as a quantity', () => {
    expect(buildOrderRequest('e1', { seatIds: ['s1', 's3'], ga: { ga: 2, other: 0 } }, seatsById)).toEqual({
      eventId: 'e1',
      items: [
        { ticketTypeId: 'vip', seatIds: ['s1', 's3'] },
        { ticketTypeId: 'ga', quantity: 2 },
      ],
    })
  })
})

describe('selectionKey', () => {
  it('ignores the order of clicks and empty GA entries', () => {
    expect(selectionKey({ seatIds: ['s2', 's1'], ga: { ga: 2, x: 0 } })).toBe(
      selectionKey({ seatIds: ['s1', 's2'], ga: { ga: 2 } }),
    )
  })

  it('changes when the selection changes', () => {
    expect(selectionKey({ seatIds: ['s1'], ga: {} })).not.toBe(selectionKey({ seatIds: ['s1'], ga: { ga: 1 } }))
  })
})

describe('withoutSeats', () => {
  it('drops seats someone else just took', () => {
    expect(withoutSeats({ seatIds: ['s1', 's2'], ga: { ga: 1 } }, ['s2'])).toEqual({ seatIds: ['s1'], ga: { ga: 1 } })
  })
})

describe('groupSeats', () => {
  it('orders sections, rows and seats naturally', () => {
    const grouped = groupSeats([
      seat('x', 'AA', 1),
      seat('y', 'B', 10, 'A'),
      seat('z', 'B', 2, 'A'),
      seat('w', 'A', 1, 'B'),
    ])

    expect(grouped.map((s) => s.name)).toEqual(['A', 'B'])
    expect(grouped[0]!.rows.map((r) => r.label)).toEqual(['B', 'AA'])
    expect(grouped[0]!.rows[0]!.seats.map((s) => s.number)).toEqual([2, 10])
  })
})
