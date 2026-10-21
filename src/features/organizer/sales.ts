import type { SalesChannel, SalesGroupBy, SalesRow } from '../../shared/api/types'

export const GROUP_LABELS: Record<SalesGroupBy, string> = {
  DAY: 'Theo ngày',
  TICKET_TYPE: 'Theo loại vé',
  CHANNEL: 'Theo kênh bán',
}

export const CHANNEL_LABELS: Record<SalesChannel, string> = {
  WEB: 'Web',
  MOBILE_APP: 'Ứng dụng di động',
}

/** Ngày bán YYYY-MM-DD (đã là ngày theo múi giờ sự kiện, BE tính) → "T3, 21/10/2026". */
export function saleDayLabel(isoDate: string, withYear = true): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y!, m! - 1, d!))
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getUTCDay()]
  const day = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  return `${weekday}, ${withYear ? `${day}/${y}` : day}`
}

/** Tên hiển thị của một dòng báo cáo theo cách gom. */
export function salesRowLabel(groupBy: SalesGroupBy, row: SalesRow): string {
  switch (groupBy) {
    case 'DAY':
      return saleDayLabel(row.key)
    case 'TICKET_TYPE':
      return row.label ?? row.key
    case 'CHANNEL':
      return CHANNEL_LABELS[row.key as SalesChannel] ?? row.key
  }
}

/**
 * Các ngày theo thứ tự thời gian, ngày không bán được vé nào cũng có (doanh thu 0): biểu đồ theo thời gian mà bỏ
 * ngày trống thì hai cột cạnh nhau trông như liền ngày.
 */
export function dailySeries(rows: SalesRow[]): SalesRow[] {
  if (rows.length === 0) return []
  const byDay = new Map(rows.map((row) => [row.key, row]))
  const days = [...byDay.keys()].sort()
  const series: SalesRow[] = []
  for (let day = days[0]!; day <= days[days.length - 1]!; day = nextDay(day)) {
    series.push(byDay.get(day) ?? { key: day, label: null, orders: 0, tickets: 0, revenue: 0 })
  }
  return series
}

function nextDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + 1)).toISOString().slice(0, 10)
}

/** Mốc trục tung tròn số (1, 2, 2,5, 5 × 10^n), từ 0 tới ít nhất `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const rough = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((f) => f * magnitude >= rough) ?? 10) * magnitude
  const ticks: number[] = []
  for (let value = 0; value < max + step; value += step) {
    ticks.push(value)
    if (value >= max) break
  }
  return ticks
}

/**
 * Cột nào được ghi ngày dưới trục hoành: cách đều, tối đa khoảng `max` nhãn, luôn có ngày đầu và ngày cuối; nhãn sát
 * ngày cuối quá thì bỏ để hai nhãn không đè lên nhau.
 */
export function axisLabelIndices(count: number, max: number): number[] {
  if (count <= 1) return count === 1 ? [0] : []
  const every = Math.max(1, Math.ceil(count / max))
  const indices: number[] = []
  for (let i = 0; i < count - 1; i += every) {
    if (i === 0 || count - 1 - i >= every / 2) indices.push(i)
  }
  indices.push(count - 1)
  return indices
}

/** Phần trăm của `part` trên `whole`, một chữ số thập phân: "12,5%". */
export function share(part: number, whole: number): string {
  if (whole <= 0) return '0%'
  return `${((part / whole) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
}
