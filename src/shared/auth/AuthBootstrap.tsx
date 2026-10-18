import { Spinner } from 'momi-ui'
import { useEffect, useState, type ReactNode } from 'react'

import { refreshSession } from './session'

/**
 * Lúc mở trang, thử khôi phục phiên từ cookie refresh (một lần) rồi mới vẽ app, để trang cần đăng nhập không đá người
 * dùng về /login trong lúc chờ. Không có cookie thì identity trả 401 nhanh, coi như khách.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    refreshSession()
      .catch(() => null)
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner size="lg" />
      </div>
    )
  }
  return children
}
