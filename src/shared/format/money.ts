const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

/** Số tiền theo kiểu Việt Nam: 1.500.000 ₫. API trả số (có thể có phần lẻ .00), VND không có xu. */
export function formatVnd(amount: number): string {
  return vnd.format(amount)
}

/**
 * Số tiền gọn cho trục biểu đồ: 950 N, 12,5 tr, 1,2 tỷ (nghìn, triệu, tỷ đồng). Không dùng `notation: 'compact'` của
 * Intl: tiếng Việt in "T" cho cả nghìn lẫn tỷ tuỳ trình duyệt, dễ đọc nhầm.
 */
export function formatVndCompact(amount: number): string {
  const abs = Math.abs(amount)
  const [unit, divisor] = abs >= 1e9 ? ['tỷ', 1e9] : abs >= 1e6 ? ['tr', 1e6] : abs >= 1e3 ? ['N', 1e3] : ['', 1]
  const value = amount / divisor
  const text = value.toLocaleString('vi-VN', { maximumFractionDigits: Math.abs(value) < 100 && divisor > 1 ? 1 : 0 })
  return unit ? `${text} ${unit}` : text
}
