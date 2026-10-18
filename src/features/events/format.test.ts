import { describe, expect, it } from 'vitest'

import { formatEventTime, saleStatus } from './format'

const event = { saleOpensAt: '2026-11-01T03:00:00Z', saleClosesAt: '2026-12-01T03:00:00Z' }

describe('saleStatus', () => {
  it('is upcoming before the sale opens', () => {
    expect(saleStatus(event, new Date('2026-10-31T00:00:00Z')).kind).toBe('upcoming')
  })

  it('is on sale from the opening instant until just before closing', () => {
    expect(saleStatus(event, new Date('2026-11-01T03:00:00Z')).kind).toBe('onSale')
    expect(saleStatus(event, new Date('2026-12-01T02:59:59Z')).kind).toBe('onSale')
  })

  it('is closed from the closing instant', () => {
    expect(saleStatus(event, new Date('2026-12-01T03:00:00Z')).kind).toBe('closed')
  })
})

describe('formatEventTime', () => {
  it("uses the event's time zone, not the viewer's", () => {
    // 13:00 UTC là 20:00 ở Việt Nam
    expect(formatEventTime('2026-12-20T13:00:00Z', 'Asia/Ho_Chi_Minh')).toContain('20:00')
  })
})
