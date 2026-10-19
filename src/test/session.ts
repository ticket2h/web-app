import type { Role } from '../shared/api/types'
import { startSession } from '../shared/auth/session'

/** Đăng nhập sẵn (không gọi API) với vai trò `role`, access token "jwt". */
export function signIn(role: Role = 'CUSTOMER', overrides: { email?: string; fullName?: string } = {}) {
  return startSession({
    accessToken: 'jwt',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: '0b000000-0000-4000-8000-000000000004',
      email: overrides.email ?? 'buyer1@test.local',
      fullName: overrides.fullName ?? 'Khách Một',
      role,
      organizerId: role === 'ORGANIZER' ? '0a000000-0000-4000-8000-000000000001' : null,
    },
  })
}
