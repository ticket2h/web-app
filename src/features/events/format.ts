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

export { formatEventTime } from '../../shared/format/time'
