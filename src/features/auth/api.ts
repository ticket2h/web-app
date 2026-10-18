import { useMutation } from '@tanstack/react-query'

import { identityApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { LoginResponse } from '../../shared/api/types'
import { startSession } from '../../shared/auth/session'

export interface Credentials {
  email: string
  password: string
}

/** Đăng nhập: access token vào bộ nhớ, identity đặt cookie refresh (httpOnly) trong cùng response. */
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const login = unwrap(await identityApi.POST('/auth/login', { body: credentials })) as LoginResponse
      return startSession(login)
    },
  })
}
