import { Badge, Button, DataTable, NativeSelect, Skeleton, Text, type DataTableColumnDef } from 'momi-ui'
import { useSearchParams } from 'react-router'

import type { AuditLogItem } from '../../shared/api/types'
import { formatDateTime } from '../../shared/format/time'
import { QueryError } from '../../shared/ui/QueryError'
import { useAuditLogs } from './api'
import { actionLabel, actorLabel, AUDIT_ACTIONS, describe, type AuditSource } from './audit'

const SOURCES: { value: AuditSource; label: string }[] = [
  { value: 'core', label: 'Bán vé (ban tổ chức, thanh toán)' },
  { value: 'identity', label: 'Tài khoản (quản trị, bảo mật)' },
]

/**
 * Lịch sử thao tác nhạy cảm (M6): ai đổi giá, ai tải danh sách khách, hệ thống hoàn tiền đơn nào. Mỗi service một
 * nguồn; bộ lọc nằm trên URL (`source`, `action`).
 */
export function AuditTab() {
  const [params, setParams] = useSearchParams()
  const source: AuditSource = params.get('source') === 'identity' ? 'identity' : 'core'
  const actions = AUDIT_ACTIONS[source]
  const action = params.get('action') && params.get('action')! in actions ? params.get('action') : null
  const logs = useAuditLogs(source, action)
  const rows = logs.data?.pages.flatMap((page) => page.items) ?? []

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  const columns: DataTableColumnDef<AuditLogItem>[] = [
    { id: 'occurredAt', header: 'Thời gian', accessor: (row) => formatDateTime(row.occurredAt), width: 170 },
    {
      id: 'actor',
      header: 'Người làm',
      accessor: actorLabel,
      width: 240,
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span>{actorLabel(row)}</span>
          {row.actor.type === 'USER' && row.actor.role && (
            <span className="text-xs text-muted-foreground">{row.actor.role}</span>
          )}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Thao tác',
      accessor: (row) => actionLabel(source, row.action),
      width: 210,
      cell: ({ row }) => (
        <Badge size="sm" tone={row.actor.type === 'SYSTEM' ? 'info' : 'neutral'} variant="soft">
          {actionLabel(source, row.action)}
        </Badge>
      ),
    },
    { id: 'details', header: 'Chi tiết', accessor: describe, width: 320 },
    {
      id: 'target',
      header: 'Đối tượng',
      accessor: (row) => row.targetEmail ?? row.targetId ?? '',
      width: 220,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.targetEmail ?? row.targetId ?? ''}</span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <NativeSelect
          aria-label="Nguồn lịch sử"
          value={source}
          onChange={(event) =>
            update({ source: event.target.value === 'core' ? null : event.target.value, action: null })
          }
          wrapperClassName="sm:w-80"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Lọc theo thao tác"
          value={action ?? ''}
          onChange={(event) => update({ action: event.target.value || null })}
          wrapperClassName="sm:w-64"
        >
          <option value="">Mọi thao tác</option>
          {Object.entries(actions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {logs.isPending && <Skeleton className="h-80 rounded-xl" />}
      {logs.isError && <QueryError title="Không tải được lịch sử" error={logs.error} onRetry={() => logs.refetch()} />}
      {logs.data && (
        <>
          <DataTable
            aria-label="Lịch sử thao tác"
            data={rows}
            columns={columns}
            variant="card"
            emptyState="Chưa có thao tác nào khớp bộ lọc"
          />
          <div className="flex flex-col items-center gap-2">
            <Text size="sm" tone="muted" aria-live="polite">
              Đang xem {rows.length.toLocaleString('vi-VN')} thao tác{logs.hasNextPage ? '' : ', đã hết lịch sử'}
            </Text>
            {logs.hasNextPage && (
              <Button variant="outline" loading={logs.isFetchingNextPage} onClick={() => logs.fetchNextPage()}>
                Xem thêm
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
