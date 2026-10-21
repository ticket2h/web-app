/**
 * Lưu một file đã tải về (Blob) xuống máy: tạo link tạm và bấm vào nó. Dùng cho file cần access token (CSV của ban
 * tổ chức): link thường không gửi được header Authorization, nên tải bằng fetch rồi mới lưu.
 * File cả triệu dòng sẽ nằm trọn trong bộ nhớ của trình duyệt trước khi lưu; đủ cho vài chục MB.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  // Trình duyệt đã bắt đầu lưu khi click() trả về; thu hồi URL sau một nhịp để Safari kịp đọc
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

/** Tên file trong header Content-Disposition (`attachment; filename="x.csv"`), không có thì dùng `fallback`. */
export function filenameFrom(contentDisposition: string | null, fallback: string): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i)
  return match?.[1] ?? fallback
}
