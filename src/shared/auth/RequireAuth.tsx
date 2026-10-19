import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useSession } from './useAuth'

/**
 * Chưa đăng nhập thì chuyển tới /login, kèm `next` để quay lại đúng trang sau khi đăng nhập. Dùng bọc một trang
 * (`children`) hoặc làm route cha cho một nhóm trang (vẽ `<Outlet />`).
 */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const session = useSession()
  const location = useLocation()
  if (!session) {
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return children ?? <Outlet />
}
