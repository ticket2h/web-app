import { useQuery } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { QueueStatus } from '../../shared/api/types'
import type { SaleStatus } from './format'

/** Hàng chờ mở trước giờ mở bán ngần này; khớp `ticket2h.waiting-room.opens-before-sale` của core-service. */
export const QUEUE_OPENS_BEFORE_MS = 30 * 60_000

/** Đang trong khoảng xếp hàng được: từ 30 phút trước giờ mở bán tới khi đóng bán. */
export function queueIsOpen(sale: SaleStatus, now: number): boolean {
  return sale.kind === 'onSale' || (sale.kind === 'upcoming' && sale.opensAt.getTime() - now <= QUEUE_OPENS_BEFORE_MS)
}

/** Được vào rồi vẫn hỏi lại ít nhất mỗi phút (vé vào cửa thường 10 phút); cũng tránh số quá lớn cho setTimeout. */
const MAX_ADMITTED_POLL_MS = 60_000

/** Hỏi lại sau bao lâu: đang chờ thì theo BE; được vào thì lúc vé vào cửa hết hạn (để xếp hàng lại), tối đa 1 phút. */
export function nextPollMs(status: QueueStatus | undefined, now: number): number | false {
  if (!status) return false
  switch (status.state) {
    case 'WAITING':
      return Math.max(status.pollAfterSeconds, 1) * 1000
    case 'NOT_IN_QUEUE':
      return 2_000
    case 'ADMITTED':
      return status.admissionExpiresAt
        ? Math.min(Math.max(Date.parse(status.admissionExpiresAt) - now, 1_000), MAX_ADMITTED_POLL_MS)
        : false
    case 'NOT_REQUIRED':
      return false
  }
}

/** "khoảng 40 giây", "khoảng 3 phút", "khoảng 1 giờ 5 phút". */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `khoảng ${Math.max(seconds, 1)} giây`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `khoảng ${minutes} phút`
  const rest = minutes % 60
  return `khoảng ${Math.floor(minutes / 60)} giờ${rest > 0 ? ` ${rest} phút` : ''}`
}

/**
 * Chỗ của mình trong phòng chờ (ADR-027 của core-service). Gọi `POST` cả khi hỏi lại: BE giữ nguyên chỗ cũ nếu đã
 * xếp, xếp lại từ cuối nếu đã bị bỏ (lâu không hỏi, vé vào cửa hết hạn), và mỗi lần hỏi là một lần báo "vẫn đang
 * chờ". Vé vào cửa (`admissionToken`) chỉ nằm trong cache của TanStack Query (bộ nhớ), như access token.
 */
export function useWaitingRoom(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['event', eventId, 'waiting-room'],
    queryFn: async () =>
      unwrap(
        await coreApi.POST('/events/{eventId}/waiting-room', { params: { path: { eventId } } }),
      ) as QueueStatus,
    enabled,
    refetchInterval: (query) => nextPollMs(query.state.data, Date.now()),
    // Lỗi tạm (Redis của BE sập: 503) thì thử lại, chỗ cũ vẫn còn khi BE hồi phục
    retry: 5,
    retryDelay: (attempt) => Math.min(2_000 * 2 ** attempt, 15_000),
  })
}
