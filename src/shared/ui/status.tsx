import { Badge } from 'momi-ui'

import type { EventStatus, OrderStatus, TicketStatus } from '../api/types'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'warning' },
  PAID: { label: 'Đã thanh toán, đang xuất vé', tone: 'info' },
  FULFILLED: { label: 'Đã có vé', tone: 'success' },
  EXPIRED: { label: 'Hết hạn giữ chỗ', tone: 'neutral' },
  CANCELLED: { label: 'Đã huỷ', tone: 'neutral' },
}

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: Tone }> = {
  VALID: { label: 'Còn hiệu lực', tone: 'success' },
  USED: { label: 'Đã sử dụng', tone: 'neutral' },
  VOID: { label: 'Đã huỷ', tone: 'danger' },
}

export const EVENT_STATUS: Record<EventStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Bản nháp', tone: 'warning' },
  PUBLISHED: { label: 'Đã công bố', tone: 'success' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = ORDER_STATUS[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const { label, tone } = TICKET_STATUS[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { label, tone } = EVENT_STATUS[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}
