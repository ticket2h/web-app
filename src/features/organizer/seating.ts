import type { OrganizerEventDetail } from '../../shared/api/types'

export interface RowRange {
  label: string
  from: number
  to: number
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Các nhãn hàng từ `first` tới `last`: "A"→"E" cho A, B, C, D, E; "1"→"3" cho 1, 2, 3. Trả rỗng nếu hai đầu không
 * cùng kiểu, ngược chiều, hoặc quá 52 hàng.
 */
export function rowLabels(first: string, last: string): string[] {
  const a = first.trim().toUpperCase()
  const b = last.trim().toUpperCase()
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    const from = Number(a)
    const to = Number(b)
    return to >= from && to - from < 52 ? Array.from({ length: to - from + 1 }, (_, i) => String(from + i)) : []
  }
  if (/^[A-Z]$/.test(a) && /^[A-Z]$/.test(b)) {
    const from = LETTERS.indexOf(a)
    const to = LETTERS.indexOf(b)
    return to >= from ? LETTERS.slice(from, to + 1).split('') : []
  }
  return []
}

/** Lưới ghế hình chữ nhật: mỗi hàng ghế `seatFrom`–`seatTo`. */
export function gridRows(first: string, last: string, seatFrom: number, seatTo: number): RowRange[] {
  if (!(seatFrom >= 1 && seatTo >= seatFrom)) return []
  return rowLabels(first, last).map((label) => ({ label, from: seatFrom, to: seatTo }))
}

export function seatTotal(rows: RowRange[]): number {
  return rows.reduce((sum, row) => sum + Math.max(0, row.to - row.from + 1), 0)
}

export interface ChecklistItem {
  label: string
  ok: boolean
}

/** Những điều core kiểm tra khi công bố (EVENT_NOT_PUBLISHABLE), để ban tổ chức thấy trước còn thiếu gì. */
export function publishChecklist(detail: OrganizerEventDetail, now = Date.now()): ChecklistItem[] {
  const seated = detail.ticketTypes.filter((t) => t.kind === 'SEATED')
  return [
    { label: 'Có ít nhất một loại vé', ok: detail.ticketTypes.length > 0 },
    {
      label: seated.length > 0 ? 'Loại vé ngồi nào cũng đã có ghế' : 'Không có loại vé ngồi cần xếp ghế',
      ok: seated.every((t) => (t.seatCount ?? 0) > 0),
    },
    { label: 'Chưa hết giờ bán vé', ok: new Date(detail.event.saleClosesAt).getTime() > now },
  ]
}
