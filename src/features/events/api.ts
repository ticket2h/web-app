import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { CreateOrderRequest, EventDetail, EventPage, Order, Seat } from '../../shared/api/types'

export const PAGE_SIZE = 12

/** Sự kiện đã công bố. `q` tìm không dấu ("son tung" ra "Sơn Tùng"); `page` tính từ 0 như API. */
export function useEvents(q: string, page: number) {
  return useQuery({
    queryKey: ['events', { q, page }],
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/events', {
          params: { query: { q: q || undefined, page, size: PAGE_SIZE } },
          signal,
        }),
      ) as EventPage,
    // Giữ trang cũ trên màn hình trong lúc tải trang mới, không nháy về skeleton
    placeholderData: keepPreviousData,
  })
}

export function eventQuery(eventId: string) {
  return {
    queryKey: ['event', eventId],
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      unwrap(await coreApi.GET('/events/{eventId}', { params: { path: { eventId } }, signal })) as EventDetail,
    staleTime: 60_000,
  }
}

/** Chi tiết sự kiện đã công bố: loại vé, giá, số vé còn. Sự kiện nháp hoặc không tồn tại: 404. */
export function useEvent(eventId: string | undefined) {
  return useQuery({ ...eventQuery(eventId ?? ''), enabled: Boolean(eventId) })
}

/**
 * Sơ đồ ghế, làm mới định kỳ để thấy ghế người khác vừa giữ. BE vẫn là nơi quyết định cuối cùng: đặt ghế vừa bị
 * giữ thì nhận SEAT_UNAVAILABLE.
 */
export function useSeats(eventId: string | undefined, options: { enabled?: boolean; live?: boolean } = {}) {
  const { enabled = true, live = false } = options
  return useQuery({
    queryKey: ['event', eventId, 'seats'],
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/events/{eventId}/seats', { params: { path: { eventId: eventId! } }, signal }),
      ) as Seat[],
    enabled: Boolean(eventId) && enabled,
    refetchInterval: live ? 15_000 : false,
  })
}

/**
 * Đặt vé. `idempotencyKey` giữ nguyên khi người dùng bấm lại cùng lựa chọn (mạng chập chờn, timeout): BE trả lại
 * đúng đơn đã tạo thay vì giữ thêm ghế.
 */
export function useCreateOrder() {
  return useMutation({
    mutationFn: async ({ body, idempotencyKey }: { body: CreateOrderRequest; idempotencyKey: string }) =>
      unwrap(
        await coreApi.POST('/orders', { body, params: { header: { 'Idempotency-Key': idempotencyKey } } }),
      ) as Order,
  })
}
