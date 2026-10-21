import { BarChart3 } from 'lucide-react'
import {
  Card,
  CardContent,
  cn,
  DataTable,
  Skeleton,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  type DataTableColumnDef,
  type DataTableSort,
} from 'momi-ui'
import { useSearchParams } from 'react-router'

import type { SalesGroupBy, SalesReport, SalesRow, SalesSort, SortDirection } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { EmptyState } from '../../shared/ui/EmptyState'
import { QueryError } from '../../shared/ui/QueryError'
import { useSalesReport } from './api'
import { GROUP_LABELS, salesRowLabel, share } from './sales'
import { DailyRevenueChart, ShareBars } from './SalesChart'

const GROUPS: SalesGroupBy[] = ['DAY', 'TICKET_TYPE', 'CHANNEL']
const SORTS: SalesSort[] = ['KEY', 'ORDERS', 'TICKETS', 'REVENUE']

/** Cột của bảng ↔ cột sắp xếp của API (BE chỉ nhận đúng các giá trị này, ADR-016). */
const COLUMN_SORT: Record<string, SalesSort> = { key: 'KEY', orders: 'ORDERS', tickets: 'TICKETS', revenue: 'REVENUE' }

/**
 * Doanh thu của sự kiện: ba con số tổng, biểu đồ, bảng. Cách gom và cột sắp xếp nằm trên URL (`group`, `sort`,
 * `dir`). Bảng sắp xếp ở BE: bấm tiêu đề cột thì gọi lại API với `sort`/`direction` mới.
 */
export function SalesPanel({ eventId }: { eventId: string }) {
  const [params, setParams] = useSearchParams()
  const groupBy = GROUPS.find((g) => g === params.get('group')) ?? 'DAY'
  const sort = SORTS.find((s) => s === params.get('sort')) ?? null
  const direction = (['ASC', 'DESC'] as const).find((d) => d === params.get('dir')) ?? null
  const report = useSalesReport(eventId, { groupBy, sort, direction })

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  if (report.isPending) return <Skeleton className="h-96 rounded-xl" />
  if (report.isError) {
    return <QueryError title="Không tải được doanh thu" error={report.error} onRetry={() => report.refetch()} />
  }
  const data = report.data

  return (
    <div className={cn('flex flex-col gap-6 transition-opacity', report.isPlaceholderData && 'opacity-60')}>
      <Totals report={data} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Gom doanh thu"
          value={groupBy}
          onValueChange={(value) => value && update({ group: value === 'DAY' ? null : value, sort: null, dir: null })}
        >
          {GROUPS.map((g) => (
            <ToggleGroupItem key={g} value={g}>
              {GROUP_LABELS[g]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Text size="xs" tone="muted">
          Số liệu cộng dồn vài giây một lần, giờ theo múi giờ của sự kiện ({data.timeZone})
        </Text>
      </div>
      {data.totals.orders === 0 && groupBy !== 'TICKET_TYPE' ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Chưa có đơn nào được thanh toán"
          description="Doanh thu hiện ở đây vài giây sau khi đơn đầu tiên thanh toán thành công."
        />
      ) : (
        <>
          <Card padding="lg">
            <CardContent>
              {groupBy === 'DAY' ? (
                <DailyRevenueChart rows={data.rows} />
              ) : (
                <ShareBars
                  rows={[...data.rows]
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((row) => ({ ...row, label: salesRowLabel(groupBy, row) }))}
                />
              )}
            </CardContent>
          </Card>
          <SalesTable
            report={data}
            onSortChange={(next) =>
              update({
                sort: next ? COLUMN_SORT[next.columnId]! : null,
                dir: next ? (next.direction.toUpperCase() as SortDirection) : null,
              })
            }
          />
        </>
      )}
    </div>
  )
}

function Totals({ report }: { report: SalesReport }) {
  const { totals } = report
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card padding="lg" className="min-w-0">
        <CardContent className="flex flex-col gap-1">
          <Text size="sm" tone="muted">
            Doanh thu
          </Text>
          {/* Doanh thu hàng trăm tỷ dài tới 17 ký tự: chữ co theo bề ngang để không tràn thẻ trên điện thoại */}
          <span className="font-display text-[clamp(1.5rem,7vw,2.25rem)] font-bold leading-tight whitespace-nowrap">
            {formatVnd(totals.revenue)}
          </span>
        </CardContent>
      </Card>
      <Stat label="Vé đã bán" value={totals.tickets} />
      <Stat label="Đơn đã thanh toán" value={totals.orders} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="lg" className="min-w-0">
      <CardContent className="flex flex-col gap-1">
        <Text size="sm" tone="muted">
          {label}
        </Text>
        <span className="font-display text-[clamp(1.5rem,7vw,2.25rem)] font-bold leading-tight">
          {value.toLocaleString('vi-VN')}
        </span>
      </CardContent>
    </Card>
  )
}

function SalesTable({ report, onSortChange }: {
  report: SalesReport
  onSortChange: (sort: DataTableSort | null) => void
}) {
  const { groupBy, totals } = report
  const columnOfSort = Object.entries(COLUMN_SORT).find(([, s]) => s === report.sort)?.[0] ?? 'key'
  const sort: DataTableSort = { columnId: columnOfSort, direction: report.direction === 'ASC' ? 'asc' : 'desc' }

  const columns: DataTableColumnDef<SalesRow>[] = [
    {
      id: 'key',
      header: groupBy === 'DAY' ? 'Ngày' : groupBy === 'TICKET_TYPE' ? 'Loại vé' : 'Kênh bán',
      accessor: (row) => (groupBy === 'TICKET_TYPE' ? (row.label ?? '') : row.key),
      cell: ({ row }) => salesRowLabel(groupBy, row),
      width: 220,
      sortable: true,
      footer: 'Tổng',
    },
    ...(groupBy === 'TICKET_TYPE'
      ? []
      : [
          {
            id: 'orders',
            header: 'Số đơn',
            accessor: (row: SalesRow) => row.orders ?? 0,
            cell: ({ row }: { row: SalesRow }) => (row.orders ?? 0).toLocaleString('vi-VN'),
            align: 'end' as const,
            width: 120,
            sortable: true,
            cellClassName: 'tabular-nums',
            footer: totals.orders.toLocaleString('vi-VN'),
          },
        ]),
    {
      id: 'tickets',
      header: 'Vé',
      accessor: 'tickets',
      cell: ({ row }) => row.tickets.toLocaleString('vi-VN'),
      align: 'end',
      width: 110,
      sortable: true,
      cellClassName: 'tabular-nums',
      footer: totals.tickets.toLocaleString('vi-VN'),
    },
    {
      id: 'revenue',
      header: 'Doanh thu',
      accessor: 'revenue',
      cell: ({ row }) => formatVnd(row.revenue),
      align: 'end',
      width: 180,
      sortable: true,
      cellClassName: 'tabular-nums',
      footer: formatVnd(totals.revenue),
    },
    {
      id: 'share',
      header: 'Tỷ lệ',
      accessor: (row) => row.revenue,
      cell: ({ row }) => share(row.revenue, totals.revenue),
      align: 'end',
      width: 100,
      cellClassName: 'tabular-nums text-muted-foreground',
    },
  ]

  return (
    <DataTable
      aria-label={`Doanh thu ${GROUP_LABELS[groupBy].toLowerCase()}`}
      data={report.rows}
      columns={columns}
      getRowId={(row) => row.key}
      variant="card"
      sort={sort}
      onSortChange={onSortChange}
      emptyState="Chưa có số liệu"
    />
  )
}
