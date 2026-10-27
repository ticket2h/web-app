import { describe, expect, it } from 'vitest'

import type { Seat } from '../../shared/api/types'
import { applyChanges, mergeSnapshot } from './liveSeats'

function seat(seatId: string, status: Seat['status'], version: number): Seat {
  return { seatId, ticketTypeId: 't1', section: 'A', row: 'A', number: Number(seatId.slice(1)), status, version }
}

describe('applyChanges', () => {
  it('áp thay đổi có version lớn hơn', () => {
    const seats = [seat('s1', 'AVAILABLE', 0), seat('s2', 'AVAILABLE', 0)]

    const next = applyChanges(seats, [{ seatId: 's1', section: 'A', status: 'HELD', version: 1 }])

    expect(next.map((s) => s.status)).toEqual(['HELD', 'AVAILABLE'])
    expect(next[0]!.version).toBe(1)
  })

  it('bỏ qua thay đổi cũ hoặc nhận lại lần nữa, và trả lại đúng mảng cũ', () => {
    const seats = [seat('s1', 'AVAILABLE', 2)]

    const next = applyChanges(seats, [
      { seatId: 's1', section: 'A', status: 'HELD', version: 1 },
      { seatId: 's9', section: 'A', status: 'HELD', version: 5 },
    ])

    expect(next).toBe(seats)
  })

  it('hai instance phát ngược thứ tự commit: vẫn giữ trạng thái mới nhất', () => {
    const seats = [seat('s1', 'AVAILABLE', 0)]

    const afterRelease = applyChanges(seats, [{ seatId: 's1', section: 'A', status: 'AVAILABLE', version: 2 }])
    const afterLateHold = applyChanges(afterRelease, [{ seatId: 's1', section: 'A', status: 'HELD', version: 1 }])

    expect(afterLateHold[0]!.status).toBe('AVAILABLE')
  })
})

describe('mergeSnapshot', () => {
  it('ảnh chụp cũ không ghi đè thay đổi mới hơn đã nhận qua SSE', () => {
    const shown = [seat('s1', 'HELD', 3), seat('s2', 'AVAILABLE', 0)]
    const stale = [seat('s1', 'AVAILABLE', 2), seat('s2', 'SOLD', 4)]

    expect(mergeSnapshot(shown, stale).map((s) => [s.status, s.version])).toEqual([
      ['HELD', 3],
      ['SOLD', 4],
    ])
  })

  it('cùng version thì lấy ảnh chụp (lượt giữ đã hết hạn)', () => {
    const shown = [seat('s1', 'HELD', 1)]

    expect(mergeSnapshot(shown, [seat('s1', 'AVAILABLE', 1)])[0]!.status).toBe('AVAILABLE')
  })

  it('chưa có gì thì lấy nguyên ảnh chụp', () => {
    const fresh = [seat('s1', 'AVAILABLE', 0)]

    expect(mergeSnapshot(undefined, fresh)).toBe(fresh)
  })
})
