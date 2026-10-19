import { useMutation } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { CheckinResponse } from '../../shared/api/types'

/**
 * Quét một mã QR ở cổng `gate`. Kết quả nghiệp vụ (OK, ALREADY_USED, TOKEN_REVOKED...) luôn là 200; nhân viên không
 * được phân công cho sự kiện của vé thì 403 FORBIDDEN.
 */
export function useCheckin() {
  return useMutation({
    mutationFn: async ({ qrToken, gate }: { qrToken: string; gate: string }) =>
      unwrap(await coreApi.POST('/checkin', { body: { qrToken, gate } })) as CheckinResponse,
  })
}
