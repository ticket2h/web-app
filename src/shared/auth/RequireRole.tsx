import { ShieldAlert } from 'lucide-react'
import { Button, Container } from 'momi-ui'
import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router'

import type { Role } from '../api/types'
import { EmptyState } from '../ui/EmptyState'
import { RequireAuth } from './RequireAuth'
import { useSession } from './useAuth'

const ROLE_NAMES: Record<Role, string> = {
  CUSTOMER: 'khách hàng',
  ORGANIZER: 'ban tổ chức',
  STAFF: 'nhân viên soát vé',
  ADMIN: 'quản trị',
}

/**
 * Trang chỉ cho một số vai trò. Đây chỉ là giao diện: BE vẫn kiểm tra quyền ở mọi API (403 FORBIDDEN).
 */
export function RequireRole({ roles, children }: { roles: Role[]; children?: ReactNode }) {
  return (
    <RequireAuth>
      <RoleGate roles={roles}>{children ?? <Outlet />}</RoleGate>
    </RequireAuth>
  )
}

function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const session = useSession()
  if (session && !roles.includes(session.user.role)) {
    return (
      <Container size="sm" className="py-16">
        <EmptyState
          icon={<ShieldAlert />}
          title="Bạn không có quyền xem trang này"
          description={`Trang này dành cho tài khoản ${roles.map((r) => ROLE_NAMES[r]).join(' hoặc ')}.`}
          action={
            <Button asChild variant="outline">
              <Link to="/">Về trang sự kiện</Link>
            </Button>
          }
        />
      </Container>
    )
  }
  return children
}
