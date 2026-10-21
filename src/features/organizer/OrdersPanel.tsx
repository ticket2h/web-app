import { ReceiptText } from 'lucide-react'
import { Button, DataTable, NativeSelect, Skeleton, Text, type DataTableColumnDef } from 'momi-ui'
import { useSearchParams } from 'react-router'

import type { OrderStatus, OrganizerOrderRow } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { formatEventTime } from '../../shared/format/time'
import { EmptyState } from '../../shared/ui/EmptyState'
import { QueryError } from '../../shared/ui/QueryError'
import { OrderStatusBadge } from '../../shared/ui/status'
import { useOrganizerOrders } from './api'
import { CHANNEL_LABELS } from './sales'

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'FULFILLED', label: 'Đã xuất vé' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'EXPIRED', label: 'Hết hạn' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
]

/**
 * Đơn của sự kiện, mới trước. Phân trang keyset: "Xem thêm" lấy trang tiếp theo từ đơn cuối của trang trước, nên dù
 * sự kiện có 200.000 đơn, trang thứ bao nhiêu cũng nhanh như trang đầu (ADR-018 ở core-service). Lọc trạng thái nằm
 * trên URL (`status`).
 */
export function OrdersPanel({ eventId, timeZone }: { eventId: string; timeZone: string }) {
  const [params, setParams] = useSearchParams()
  const status = STATUSES.find((s) => s.value === params.get('status'))?.value ?? null
  const orders = useOrganizerOrders(eventId, status)
  const rows = orders.data?.pages.flatMap((page) => page.items) ?? []

  const setStatus = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('status', value)
    else next.delete('status')
    setParams(next, { replace: true })
  }

  const columns: DataTableColumnDef<OrganizerOrderRow>[] = [
    {
      id: 'createdAt',
      header: 'Đặt lúc',
      accessor: 'createdAt',
      cell: ({ row }) => formatEventTime(row.createdAt, timeZone),
      width: 210,
    },
    {
      id: 'buyer',
      header: 'Người mua',
      accessor: (row) => row.buyer?.fullName ?? '',
      cell: ({ row }) =>
        row.buyer ? (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{row.buyer.fullName}</span>
            <span className="truncate text-xs text-muted-foreground">{row.buyer.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Tài khoản không còn</span>
        ),
      width: 260,
    },
    {
      id: 'tickets',
      header: 'Vé',
      accessor: 'tickets',
      align: 'end',
      width: 80,
      cellClassName: 'tabular-nums',
    },
    {
      id: 'total',
      header: 'Tổng tiền',
      accessor: 'totalAmount',
      cell: ({ row }) => formatVnd(row.totalAmount),
      align: 'end',
      width: 160,
      cellClassName: 'tabular-nums',
    },
    {
      id: 'channel',
      header: 'Kênh',
      accessor: (row) => CHANNEL_LABELS[row.salesChannel],
      width: 160,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessor: 'status',
      cell: ({ row }) => <OrderStatusBadge status={row.status} />,
      width: 160,
    },
    {
      id: 'id',
      header: 'Mã đơn',
      accessor: (row) => row.orderId.slice(0, 8),
      cellClassName: 'font-mono text-xs text-muted-foreground',
      width: 110,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <NativeSelect
        aria-label="Lọc theo trạng thái đơn"
        value={status ?? ''}
        onChange={(event) => setStatus(event.target.value)}
        wrapperClassName="sm:w-56"
      >
        <option value="">Mọi trạng thái</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </NativeSelect>
      {orders.isPending && <Skeleton className="h-80 rounded-xl" />}
      {orders.isError && (
        <QueryError title="Không tải được đơn hàng" error={orders.error} onRetry={() => orders.refetch()} />
      )}
      {orders.data &&
        (rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptText />}
            title={status ? 'Không có đơn nào ở trạng thái này' : 'Chưa có đơn nào'}
            description="Đơn hiện ở đây ngay khi khách đặt vé."
          />
        ) : (
          <>
            <DataTable
              aria-label="Đơn hàng"
              data={rows}
              columns={columns}
              getRowId={(row) => row.orderId}
              variant="card"
            />
            <div className="flex flex-col items-center gap-2">
              <Text size="sm" tone="muted" aria-live="polite">
                Đang xem {rows.length.toLocaleString('vi-VN')} đơn{orders.hasNextPage ? '' : ', đã hết danh sách'}
              </Text>
              {orders.hasNextPage && (
                <Button variant="outline" loading={orders.isFetchingNextPage} onClick={() => orders.fetchNextPage()}>
                  Xem thêm
                </Button>
              )}
            </div>
          </>
        ))}
    </div>
  )
}
