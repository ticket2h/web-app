import type { CheckinResult } from '../../shared/api/types'

export type ResultTone = 'success' | 'warning' | 'danger'

/** Tiêu đề lớn và màu cho từng kết quả quét. Câu chi tiết lấy từ `message` của BE. */
export const RESULT_VIEW: Record<CheckinResult | 'FORBIDDEN', { title: string; tone: ResultTone }> = {
  OK: { title: 'Mời vào', tone: 'success' },
  ALREADY_USED: { title: 'Vé đã được dùng', tone: 'warning' },
  TOKEN_REVOKED: { title: 'Mã QR cũ', tone: 'danger' },
  VOIDED: { title: 'Vé đã huỷ', tone: 'danger' },
  INVALID_TOKEN: { title: 'Mã không hợp lệ', tone: 'danger' },
  WRONG_EVENT_STAFF: { title: 'Sai sự kiện', tone: 'danger' },
  FORBIDDEN: { title: 'Sai sự kiện', tone: 'danger' },
}

/** Camera đọc cùng một mã nhiều lần mỗi giây: bỏ qua mã vừa quét trong `windowMs`. */
export function isRepeatScan(
  last: { token: string; at: number } | null,
  token: string,
  now: number,
  windowMs = 4000,
): boolean {
  return last !== null && last.token === token && now - last.at < windowMs
}
