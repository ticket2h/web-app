import { describe, expect, it } from 'vitest'

import { transferBlockedReason } from './transfer'

const startsAt = '2026-12-20T13:00:00Z'
const before = (hours: number) => new Date(startsAt).getTime() - hours * 3600_000

describe('transferBlockedReason', () => {
  it('allows a valid ticket more than two hours before the show', () => {
    expect(transferBlockedReason({ status: 'VALID', eventStartsAt: startsAt }, before(3))).toBeNull()
  })

  it('blocks inside the two-hour cutoff', () => {
    expect(transferBlockedReason({ status: 'VALID', eventStartsAt: startsAt }, before(1.5))).toMatch(/2 giờ/)
  })

  it('blocks used and void tickets', () => {
    expect(transferBlockedReason({ status: 'USED', eventStartsAt: startsAt }, before(48))).toMatch(/sử dụng/)
    expect(transferBlockedReason({ status: 'VOID', eventStartsAt: startsAt }, before(48))).toMatch(/huỷ/)
  })
})
