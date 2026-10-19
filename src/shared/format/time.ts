/**
 * Giờ của sự kiện luôn hiển thị theo múi giờ của sự kiện (không theo máy người xem): khán giả cần giờ tại nơi diễn.
 * Giờ của đơn hàng, vé (lúc tạo, lúc thanh toán) là mốc thời gian của chính người dùng, hiển thị theo máy họ.
 */
export function formatEventTime(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  // "Thứ 4, 25/11/2026 · 20:00": ngày trước giờ, dễ đọc hơn thứ tự mặc định của Intl ("20:00 Thứ 4, ...")
  return `${get('weekday')}, ${get('day')}/${get('month')}/${get('year')} · ${get('hour')}:${get('minute')}`
}

export interface EventDateParts {
  /** "20" */
  day: string
  /** "TH12" */
  month: string
  year: string
  /** "Chủ Nhật" */
  weekday: string
  /** "20:00" */
  time: string
}

/** Từng phần của ngày diễn để vẽ poster và cuống vé, theo múi giờ của sự kiện. */
export function eventDateParts(iso: string, timeZone: string): EventDateParts {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    weekday: 'long',
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday')
  return {
    day: get('day'),
    month: `TH${get('month')}`,
    year: get('year'),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    time: `${get('hour')}:${get('minute')}`,
  }
}

/** Mốc thời gian của người dùng (đặt đơn, thanh toán, check-in), theo giờ máy họ. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Thời gian còn lại dạng "09:41" (hoặc "1:02:05" khi quá một giờ). Âm thì là "00:00". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}
