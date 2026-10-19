import { useEffect, useState } from 'react'

/** Giờ hiện tại, cập nhật mỗi `intervalMs` (đếm ngược hạn giữ chỗ, trạng thái mở bán). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
