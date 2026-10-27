import type { Seat, SeatStatus } from '../../shared/api/types'

/** Một ghế đổi trạng thái, trong event `seats` của luồng SSE (ADR-024 của core-service). */
export interface SeatChange {
  seatId: string
  section: string
  status: SeatStatus
  version: number
}

/** Ảnh chụp sơ đồ ghế kèm `seq` (header `Seat-Map-Seq`): mọi thay đổi có số thứ tự ≤ `seq` đã nằm trong ảnh chụp. */
export interface SeatMapData {
  seats: Seat[]
  seq: number
}

/**
 * Áp thay đổi từ luồng SSE. Chỉ áp khi `version` lớn hơn ghế đang hiển thị: thay đổi đến trễ hay đến hai lần (hai
 * instance phát gần nhau, nối lại sau khi mất mạng) không kéo ghế về trạng thái cũ. Không có gì đổi thì trả lại đúng
 * mảng cũ để React không vẽ lại.
 */
export function applyChanges(seats: Seat[], changes: SeatChange[]): Seat[] {
  const byId = new Map(changes.map((change) => [change.seatId, change]))
  let changed = false
  const next = seats.map((seat) => {
    const change = byId.get(seat.seatId)
    if (!change || change.version <= seat.version) return seat
    changed = true
    return { ...seat, status: change.status, version: change.version }
  })
  return changed ? next : seats
}

/**
 * Ghép ảnh chụp vừa tải với dữ liệu đang hiển thị. Ảnh chụp có thể cũ tới một giây (cache của BE) nên ghế nào luồng
 * SSE đã đưa lên version lớn hơn thì giữ bản đang hiển thị. Cùng version thì lấy ảnh chụp: chỉ khác nhau khi lượt giữ
 * ghế đã hết hạn (BE tính lúc chụp), và ảnh chụp đúng hơn.
 */
export function mergeSnapshot(current: Seat[] | undefined, fresh: Seat[]): Seat[] {
  if (!current) return fresh
  const shown = new Map(current.map((seat) => [seat.seatId, seat]))
  return fresh.map((seat) => {
    const old = shown.get(seat.seatId)
    return old && old.version > seat.version ? old : seat
  })
}
