const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

/** Số tiền theo kiểu Việt Nam: 1.500.000 ₫. API trả số (có thể có phần lẻ .00), VND không có xu. */
export function formatVnd(amount: number): string {
  return vnd.format(amount)
}
