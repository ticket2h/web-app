import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { CreateOrderRequest, EventDetail, EventPage, Order, Seat } from '../../shared/api/types'
import { mergeSnapshot, type SeatMapData } from './liveSeats'
import { useSeatStream } from './useSeatStream'

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

/** Sơ đồ ghế trực tiếp: thay đổi qua SSE; không nối được SSE thì tải lại ngần này một lần. */
const POLL_WITHOUT_STREAM_MS = 15_000
/** Có SSE vẫn tải lại thưa: lưới an toàn cho thay đổi bị lỡ lúc Redis của BE gặp sự cố. */
const POLL_WITH_STREAM_MS = 60_000

/**
 * Sơ đồ ghế. `live`: ghế người khác vừa giữ, trả, mua hiện ngay (SSE, dưới một giây, kể cả khi họ nối vào instance
 * khác của core). BE vẫn là nơi quyết định cuối cùng: đặt ghế vừa bị giữ thì nhận SEAT_UNAVAILABLE.
 */
export function useSeats(eventId: string | undefined, options: { enabled?: boolean; live?: boolean } = {}) {
  const { enabled = true, live = false } = options
  const queryClient = useQueryClient()
  const queryKey = ['event', eventId, 'seats']
  const active = Boolean(eventId) && enabled
  const stream = useSeatStream(active && live ? `/api/core/events/${eventId}/seats/stream` : null, queryKey)
  return useQuery({
    queryKey,
    queryFn: async ({ signal }): Promise<SeatMapData> => {
      const result = await coreApi.GET('/events/{eventId}/seats', { params: { path: { eventId: eventId! } }, signal })
      const seats = unwrap(result) as Seat[]
      const seq = Number(result.response.headers.get('Seat-Map-Seq') ?? 0)
      return { seats: mergeSnapshot(queryClient.getQueryData<SeatMapData>(queryKey)?.seats, seats), seq }
    },
    select: (data) => data.seats,
    enabled: active,
    refetchInterval: live ? (stream.connected ? POLL_WITH_STREAM_MS : POLL_WITHOUT_STREAM_MS) : false,
  })
}

/**
 * Đặt vé. `idempotencyKey` giữ nguyên khi người dùng bấm lại cùng lựa chọn (mạng chập chờn, timeout): BE trả lại
 * đúng đơn đã tạo thay vì giữ thêm ghế.
 */
export function useCreateOrder() {
  return useMutation({
    mutationFn: async ({ body, idempotencyKey, admissionToken }: CreateOrderInput) =>
      unwrap(
        await coreApi.POST('/orders', {
          body,
          params: { header: { 'Idempotency-Key': idempotencyKey, 'Admission-Token': admissionToken ?? undefined } },
        }),
      ) as Order,
  })
}

interface CreateOrderInput {
  body: CreateOrderRequest
  idempotencyKey: string
  /** Vé vào cửa từ phòng chờ, bắt buộc khi sự kiện có phòng chờ (`event.waitingRoom`). */
  admissionToken?: string | null
}
