/**
 * Trang quay về sau khi đăng nhập, lấy từ `?next=`. Chỉ nhận đường dẫn trong app ("/..."), không nhận "//evil.com"
 * hay "https://...", để link đăng nhập không bị dùng chuyển người dùng sang trang khác (open redirect).
 */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/'
  }
  return next
}
