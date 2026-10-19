import { describe, expect, it } from 'vitest'

import { formatVnd } from './money'
import { eventDateParts, formatCountdown, formatEventTime } from './time'
import { isoToWallTime, wallTimeToIso } from './zoned'

describe('formatVnd', () => {
  it('uses Vietnamese grouping and no decimals', () => {
    expect(formatVnd(1_500_000).replace(/\s/g, ' ')).toBe('1.500.000 ₫')
    expect(formatVnd(4_600_000.0).replace(/\s/g, ' ')).toBe('4.600.000 ₫')
  })
})

describe('eventDateParts', () => {
  it('splits the date in the event time zone', () => {
    // 13:00 UTC ngày 20/12 là 20:00 ở Việt Nam
    expect(eventDateParts('2026-12-20T13:00:00Z', 'Asia/Ho_Chi_Minh')).toEqual({
      day: '20',
      month: 'TH12',
      year: '2026',
      weekday: 'Chủ Nhật',
      time: '20:00',
    })
  })

  it('moves to the next day when the event zone is already past midnight', () => {
    expect(eventDateParts('2026-12-20T18:30:00Z', 'Asia/Ho_Chi_Minh').day).toBe('21')
  })
})

describe('formatEventTime', () => {
  it('puts the date before the time, in the event time zone', () => {
    expect(formatEventTime('2026-12-20T13:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('CN, 20/12/2026 · 20:00')
    // Tên thứ viết tắt tuỳ bản ICU: Node ghi "Th 4", Chrome ghi "Thứ 4"
    expect(formatEventTime('2026-11-25T04:42:00Z', 'Asia/Ho_Chi_Minh')).toMatch(/^Th(ứ)? 4, 25\/11\/2026 · 11:42$/)
  })
})

describe('formatCountdown', () => {
  it('shows minutes and seconds, rounding up partial seconds', () => {
    expect(formatCountdown(581_200)).toBe('09:42')
    expect(formatCountdown(3_725_000)).toBe('1:02:05')
  })

  it('never goes negative', () => {
    expect(formatCountdown(-5_000)).toBe('00:00')
  })
})

describe('zoned wall time', () => {
  it('converts a Vietnam wall time to UTC and back', () => {
    const iso = wallTimeToIso({ year: 2026, month: 12, day: 20, time: '20:00' }, 'Asia/Ho_Chi_Minh')
    expect(iso).toBe('2026-12-20T13:00:00.000Z')
    expect(isoToWallTime(iso, 'Asia/Ho_Chi_Minh')).toEqual({ year: 2026, month: 12, day: 20, time: '20:00' })
  })

  it('handles a zone with daylight saving time', () => {
    // New York: 1/7 là giờ mùa hè (UTC−4), 1/12 là giờ mùa đông (UTC−5)
    expect(wallTimeToIso({ year: 2026, month: 7, day: 1, time: '09:30' }, 'America/New_York')).toBe(
      '2026-07-01T13:30:00.000Z',
    )
    expect(wallTimeToIso({ year: 2026, month: 12, day: 1, time: '09:30' }, 'America/New_York')).toBe(
      '2026-12-01T14:30:00.000Z',
    )
  })
})
