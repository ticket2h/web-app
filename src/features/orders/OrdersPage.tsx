import { useQueries } from '@tanstack/react-query'
import { ChevronRight, ReceiptText } from 'lucide-react'
import { Button, Container, Skeleton, Text } from 'momi-ui'
import { Link } from 'react-router'

import type { EventDetail } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { formatDateTime } from '../../shared/format/time'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PageHeader } from '../../shared/ui/PageHeader'
import { PosterArt } from '../../shared/ui/PosterArt'
import { QueryError } from '../../shared/ui/QueryError'
import { OrderStatusBadge } from '../../shared/ui/status'
import { eventQuery } from '../events/api'
import { useMyOrders } from './api'

export function OrdersPage() {
  const orders = useMyOrders()
  const eventIds = [...new Set((orders.data ?? []).map((o) => o.eventId))]
  // Tên sự kiện: mỗi sự kiện hỏi một lần, dùng chung cache với trang sự kiện
  const events = useQueries({
    queries: eventIds.map((id) => eventQuery(id)),
    combine: (results) => new Map(results.flatMap((r) => (r.data ? [[r.data.id, r.data] as const] : []))),
  })

  return (
    <Container size="md" className="py-10">
      <PageHeader eyebrow="Tài khoản" title="Đơn hàng của tôi" description="50 đơn gần nhất, mới nhất ở trên." />

      {orders.isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}
      {orders.isError && (
        <QueryError title="Không tải được đơn hàng" error={orders.error} onRetry={() => orders.refetch()} />
      )}
      {orders.data?.length === 0 && (
        <EmptyState
          icon={<ReceiptText />}
          title="Bạn chưa có đơn hàng nào"
          description="Chọn một sự kiện và giữ chỗ, đơn hàng sẽ hiện ở đây."
          action={
            <Button asChild>
              <Link to="/">Xem sự kiện</Link>
            </Button>
          }
        />
      )}
      {orders.data && orders.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {orders.data.map((order) => {
            const event: EventDetail | undefined = events.get(order.eventId)
            return (
              <li key={order.orderId}>
                <Link
                  to={`/orders/${order.orderId}`}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-3 pr-4 transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {event ? (
                    <PosterArt
                      seed={event.id}
                      title={event.title}
                      startsAt={event.startsAt}
                      timeZone={event.timeZone}
                      variant="mini"
                      className="size-16 shrink-0 rounded-lg"
                    />
                  ) : (
                    <Skeleton className="size-16 shrink-0 rounded-lg" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Text weight="semibold" truncate>
                      {event?.title ?? 'Sự kiện'}
                    </Text>
                    <Text size="sm" tone="muted">
                      Đặt lúc {formatDateTime(order.createdAt)} · {formatVnd(order.totalAmount)}
                    </Text>
                    <div className="mt-1.5 sm:hidden">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Container>
  )
}
