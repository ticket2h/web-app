import type { CreateOrderRequest, Seat, TicketTypeView } from '../../shared/api/types'

/** Lựa chọn của khách trên trang sự kiện: các ghế đã chọn và số vé GA theo từng loại. */
export interface Selection {
  seatIds: string[]
  ga: Record<string, number>
}

export const EMPTY_SELECTION: Selection = { seatIds: [], ga: {} }

export interface SelectionLine {
  ticketType: TicketTypeView
  quantity: number
  /** Nhãn ghế ("A · Hàng B · 5") với vé ngồi */
  seats: string[]
  amount: number
}

export function seatLabel(seat: Pick<Seat, 'section' | 'row' | 'number'>): string {
  return `${seat.section} · Hàng ${seat.row} · Ghế ${seat.number}`
}

export function selectedCount(selection: Selection): number {
  return selection.seatIds.length + Object.values(selection.ga).reduce((sum, n) => sum + n, 0)
}

/** Từng dòng của giỏ vé (theo thứ tự loại vé của sự kiện) và tổng tiền. */
export function summarize(
  selection: Selection,
  ticketTypes: TicketTypeView[],
  seatsById: Map<string, Seat>,
): { lines: SelectionLine[]; total: number; count: number } {
  const lines: SelectionLine[] = []
  for (const type of ticketTypes) {
    if (type.kind === 'GA') {
      const quantity = selection.ga[type.id] ?? 0
      if (quantity > 0) {
        lines.push({ ticketType: type, quantity, seats: [], amount: quantity * type.price })
      }
      continue
    }
    const seats = selection.seatIds
      .map((id) => seatsById.get(id))
      .filter((seat): seat is Seat => seat?.ticketTypeId === type.id)
    if (seats.length > 0) {
      lines.push({ ticketType: type, quantity: seats.length, seats: seats.map(seatLabel), amount: seats.length * type.price })
    }
  }
  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}

/** Body của POST /orders: ghế gom theo loại vé (`seatIds`), vé GA theo `quantity`. */
export function buildOrderRequest(
  eventId: string,
  selection: Selection,
  seatsById: Map<string, Seat>,
): CreateOrderRequest {
  const seatsByType = new Map<string, string[]>()
  for (const id of selection.seatIds) {
    const seat = seatsById.get(id)
    if (!seat) continue
    seatsByType.set(seat.ticketTypeId, [...(seatsByType.get(seat.ticketTypeId) ?? []), id])
  }
  const items: CreateOrderRequest['items'] = [...seatsByType].map(([ticketTypeId, seatIds]) => ({
    ticketTypeId,
    seatIds,
  }))
  for (const [ticketTypeId, quantity] of Object.entries(selection.ga)) {
    if (quantity > 0) items.push({ ticketTypeId, quantity })
  }
  return { eventId, items }
}

/** Khoá ổn định của một lựa chọn: cùng lựa chọn thì dùng lại Idempotency-Key cũ, đổi lựa chọn thì sinh key mới. */
export function selectionKey(selection: Selection): string {
  const seats = [...selection.seatIds].sort().join(',')
  const ga = Object.entries(selection.ga)
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, n]) => `${id}x${n}`)
    .join(',')
  return `${seats}|${ga}`
}

/** Bỏ khỏi lựa chọn những ghế BE báo đã có người giữ (SEAT_UNAVAILABLE kèm `unavailableSeatIds`). */
export function withoutSeats(selection: Selection, seatIds: string[]): Selection {
  const removed = new Set(seatIds)
  return { ...selection, seatIds: selection.seatIds.filter((id) => !removed.has(id)) }
}

export interface SeatRow {
  label: string
  seats: Seat[]
}

export interface SeatSection {
  name: string
  rows: SeatRow[]
}

const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' })

/** Sơ đồ ghế theo khu → hàng → số ghế, sắp xếp tự nhiên (hàng "B" trước "AA", ghế 2 trước 10). */
export function groupSeats(seats: Seat[]): SeatSection[] {
  const sections = new Map<string, Map<string, Seat[]>>()
  for (const seat of seats) {
    const rows = sections.get(seat.section) ?? new Map<string, Seat[]>()
    rows.set(seat.row, [...(rows.get(seat.row) ?? []), seat])
    sections.set(seat.section, rows)
  }
  const byRowLabel = (a: string, b: string) => a.length - b.length || collator.compare(a, b)
  return [...sections]
    .sort(([a], [b]) => collator.compare(a, b))
    .map(([name, rows]) => ({
      name,
      rows: [...rows]
        .sort(([a], [b]) => byRowLabel(a, b))
        .map(([label, rowSeats]) => ({ label, seats: rowSeats.sort((a, b) => a.number - b.number) })),
    }))
}
