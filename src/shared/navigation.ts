/** Chuyển cả trang sang địa chỉ ngoài app (trang thanh toán MockPay). Tách riêng để test thay được. */
export function goToExternal(url: string): void {
  window.location.assign(url)
}
