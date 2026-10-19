/**
 * Đổi giữa "giờ treo tường" ở một múi giờ (ngày + "HH:mm" người tổ chức nhập) và mốc thời gian ISO (API nhận và
 * trả `Instant`). Ban tổ chức nhập giờ diễn theo múi giờ của sự kiện, dù máy họ đặt múi giờ nào.
 */

export interface WallTime {
  year: number
  /** 1–12 */
  month: number
  day: number
  /** "HH:mm", 24 giờ */
  time: string
}

/** Mốc ISO (UTC) của giờ treo tường `wall` tại `timeZone`. */
export function wallTimeToIso(wall: WallTime, timeZone: string): string {
  const [hour = 0, minute = 0] = wall.time.split(':').map(Number)
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, hour, minute)
  // Độ lệch của múi giờ tại thời điểm đó; tính hai lần để đúng cả quanh lúc đổi giờ mùa hè
  let instant = asUtc - offsetMs(asUtc, timeZone)
  instant = asUtc - offsetMs(instant, timeZone)
  return new Date(instant).toISOString()
}

/** Giờ treo tường tại `timeZone` của mốc `iso`. */
export function isoToWallTime(iso: string, timeZone: string): WallTime {
  const parts = partsAt(new Date(iso).getTime(), timeZone)
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    time: `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`,
  }
}

function offsetMs(instant: number, timeZone: string): number {
  const p = partsAt(instant, timeZone)
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return wallAsUtc - Math.floor(instant / 1000) * 1000
}

function partsAt(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant))
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}
