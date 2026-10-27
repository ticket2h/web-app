import { describe, expect, it } from 'vitest'

import type { QueueStatus } from '../../shared/api/types'
import { formatWait, nextPollMs, queueIsOpen } from './waitingRoom'

const NOW = Date.parse('2026-11-01T12:00:00Z')

function status(overrides: Partial<QueueStatus>): QueueStatus {
  return {
    state: 'WAITING',
    position: 10,
    waiting: 100,
    estimatedWaitSeconds: 5,
    pollAfterSeconds: 2,
    admissionToken: null,
    admissionExpiresAt: null,
    ...overrides,
  }
}

describe('queueIsOpen', () => {
  it('mở từ 30 phút trước giờ mở bán tới khi đóng bán', () => {
    expect(queueIsOpen({ kind: 'upcoming', opensAt: new Date(NOW + 31 * 60_000) }, NOW)).toBe(false)
    expect(queueIsOpen({ kind: 'upcoming', opensAt: new Date(NOW + 29 * 60_000) }, NOW)).toBe(true)
    expect(queueIsOpen({ kind: 'onSale', closesAt: new Date(NOW + 1) }, NOW)).toBe(true)
    expect(queueIsOpen({ kind: 'closed' }, NOW)).toBe(false)
  })
})

describe('nextPollMs', () => {
  it('đang chờ: theo pollAfterSeconds của BE', () => {
    expect(nextPollMs(status({ pollAfterSeconds: 15 }), NOW)).toBe(15_000)
  })

  it('được vào: hỏi lại lúc vé vào cửa hết hạn, nhưng không thưa hơn mỗi phút', () => {
    const soon = status({ state: 'ADMITTED', admissionExpiresAt: new Date(NOW + 20_000).toISOString() })
    const later = status({ state: 'ADMITTED', admissionExpiresAt: new Date(NOW + 600_000).toISOString() })

    expect(nextPollMs(soon, NOW)).toBe(20_000)
    expect(nextPollMs(later, NOW)).toBe(60_000)
  })

  it('sự kiện không có phòng chờ: không hỏi lại', () => {
    expect(nextPollMs(status({ state: 'NOT_REQUIRED' }), NOW)).toBe(false)
  })
})

describe('formatWait', () => {
  it('đổi giây sang câu dễ đọc', () => {
    expect(formatWait(0)).toBe('khoảng 1 giây')
    expect(formatWait(45)).toBe('khoảng 45 giây')
    expect(formatWait(170)).toBe('khoảng 3 phút')
    expect(formatWait(3900)).toBe('khoảng 1 giờ 5 phút')
  })
})
