import type { EventSummary } from '../../shared/api/types'

export type SaleStatus =
  | { kind: 'upcoming'; opensAt: Date }
  | { kind: 'onSale'; closesAt: Date }
  | { kind: 'closed' }

/** Trạng thái mở bán theo giờ máy người dùng. API vẫn là nơi quyết định cuối cùng (SALE_NOT_OPEN). */
export function saleStatus(
  event: Pick<EventSummary, 'saleOpensAt' | 'saleClosesAt'>,
  now = new Date(),
): SaleStatus {
  const opensAt = new Date(event.saleOpensAt)
  const closesAt = new Date(event.saleClosesAt)
  if (now < opensAt) {
    return { kind: 'upcoming', opensAt }
  }
  if (now < closesAt) {
    return { kind: 'onSale', closesAt }
  }
  return { kind: 'closed' }
}

/** Giờ hiển thị theo múi giờ của sự kiện (không theo máy người xem): khán giả cần giờ tại nơi diễn. */
export function formatEventTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
