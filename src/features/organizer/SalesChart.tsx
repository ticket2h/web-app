import { cn } from 'momi-ui'
import { useState, type KeyboardEvent } from 'react'

import type { SalesRow } from '../../shared/api/types'
import { formatVnd, formatVndCompact } from '../../shared/format/money'
import { axisLabelIndices, dailySeries, niceTicks, saleDayLabel, share } from './sales'

const LABELS_ON_AXIS = 6

/**
 * Doanh thu theo ngày: cột mảnh (tối đa 24px, bo 4px ở đầu cột, vuông ở đường đáy), một màu vì chỉ có một chuỗi số
 * liệu, khe 2px giữa các cột. Ngày không bán được vé vẫn có chỗ (cột rỗng) để trục thời gian không bị co. Di chuột
 * hoặc dùng phím mũi tên (sau khi Tab vào biểu đồ) để xem từng ngày; bảng bên dưới có đủ số liệu cho ai không xem
 * được biểu đồ.
 */
export function DailyRevenueChart({ rows }: { rows: SalesRow[] }) {
  const series = dailySeries(rows)
  const [active, setActive] = useState<number | null>(null)
  if (series.length === 0) return null

  const ticks = niceTicks(Math.max(...series.map((row) => row.revenue)))
  const top = ticks[ticks.length - 1] || 1
  const last = series.length - 1
  // Màn hình rộng: khoảng 6 nhãn ngày; màn hình hẹp (điện thoại) chỉ đủ chỗ cho 3
  const wideLabels = new Set(axisLabelIndices(series.length, LABELS_ON_AXIS))
  const narrowLabels = new Set(axisLabelIndices(series.length, 3))
  const labelIndices = [...new Set([...wideLabels, ...narrowLabels])].sort((a, b) => a - b)
  const total = series.reduce((sum, row) => sum + row.revenue, 0)
  const current = active === null ? null : series[active]!

  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      ArrowLeft: Math.max(0, (active ?? series.length) - 1),
      Home: 0,
      End: last,
    }
    if (event.key in moves) {
      event.preventDefault()
      setActive(moves[event.key]!)
    } else if (event.key === 'Escape') {
      setActive(null)
    }
  }

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex gap-3">
        <div className="relative h-56 w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground" aria-hidden>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(tick / top) * 100}%` }}>
              {formatVndCompact(tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            role="group"
            tabIndex={0}
            aria-label={`Doanh thu theo ngày, ${series.length} ngày. Dùng phím mũi tên để nghe từng ngày.`}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive(null)}
            className="relative h-56 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            {ticks.map((tick) => (
              <div
                key={tick}
                aria-hidden
                className="absolute inset-x-0 border-t border-border"
                style={{ bottom: `${(tick / top) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-0.5" aria-hidden>
              {series.map((row, i) => (
                // Cả cột cao (không chỉ phần tô màu) là vùng di chuột, để ngày doanh thu thấp vẫn trỏ trúng
                <div
                  key={row.key}
                  className="flex h-full min-w-0 flex-1 items-end justify-center"
                  onPointerEnter={() => setActive(i)}
                >
                  <div
                    className={cn(
                      'w-full max-w-6 rounded-t bg-chart transition-opacity',
                      active !== null && active !== i && 'opacity-45',
                    )}
                    style={{ height: `${(row.revenue / top) * 100}%`, minHeight: row.revenue > 0 ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>
            {current && active !== null && (
              <div
                className={cn(
                  'pointer-events-none absolute top-0 z-10 min-w-40 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md',
                  active < series.length * 0.2 ? 'translate-x-0' : active > series.length * 0.8 ? '-translate-x-full' : '-translate-x-1/2',
                )}
                style={{ left: `${((active + 0.5) / series.length) * 100}%` }}
              >
                <div className="text-xs text-muted-foreground">{saleDayLabel(current.key)}</div>
                <div className="font-semibold tabular-nums">{formatVnd(current.revenue)}</div>
                <div className="text-xs tabular-nums text-muted-foreground">
                  {current.tickets.toLocaleString('vi-VN')} vé · {(current.orders ?? 0).toLocaleString('vi-VN')}{' '}
                  đơn · {share(current.revenue, total)}
                </div>
              </div>
            )}
          </div>
          <div className="relative mt-2 h-4 text-xs tabular-nums text-muted-foreground" aria-hidden>
            {labelIndices.map((i) => (
              <span
                key={series[i]!.key}
                className={cn(
                  'absolute whitespace-nowrap',
                  i === last ? '-translate-x-full' : i > 0 && '-translate-x-1/2',
                  !narrowLabels.has(i) && 'max-sm:hidden',
                  !wideLabels.has(i) && 'sm:hidden',
                )}
                style={{ left: i === 0 ? '0%' : i === last ? '100%' : `${((i + 0.5) / series.length) * 100}%` }}
              >
                {saleDayLabel(series[i]!.key, false).split(', ')[1]}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {current
          ? `${saleDayLabel(current.key)}: ${formatVnd(current.revenue)}, ${current.tickets} vé, `
            + `${current.orders ?? 0} đơn`
          : ''}
      </p>
    </figure>
  )
}

/**
 * Doanh thu theo loại vé hoặc theo kênh: thanh ngang một màu, dài theo doanh thu, số tiền và tỷ lệ ghi ngay cuối
 * thanh (ít dòng nên ghi hết được, không cần tooltip).
 */
export function ShareBars({ rows }: { rows: { key: string; label: string; revenue: number; tickets: number }[] }) {
  const max = Math.max(0, ...rows.map((row) => row.revenue))
  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(6rem,12rem)_1fr] items-center gap-x-4 gap-y-1 max-sm:grid-cols-1">
          <span className="truncate text-sm font-medium">{row.label}</span>
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="h-3 min-w-0.5 rounded-r bg-chart"
              style={{ width: `${max > 0 ? (row.revenue / max) * 70 : 0}%` }}
              aria-hidden
            />
            <span className="shrink-0 text-sm tabular-nums">
              {formatVnd(row.revenue)}
              <span className="ml-2 text-muted-foreground">{share(row.revenue, total)}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
