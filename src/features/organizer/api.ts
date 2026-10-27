import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type {
  EventRequest,
  OrderStatus,
  OrganizerEvent,
  OrganizerEventDetail,
  OrganizerOrderPage,
  OrganizerTicketType,
  OrganizerVenue,
  SalesGroupBy,
  SalesReport,
  SalesSort,
  SeatImportResult,
  SeatSectionRequest,
  SortDirection,
  StaffMember,
  TicketTypeRequest,
  WaitingRoomStats,
} from '../../shared/api/types'
import { filenameFrom, saveBlob } from '../../shared/download'

/** Mọi API ở đây chỉ chạy với tài khoản ORGANIZER và chỉ thấy dữ liệu của ban tổ chức mình (BE kiểm tra). */
const keys = {
  venues: ['organizer', 'venues'] as const,
  events: ['organizer', 'events'] as const,
  event: (id: string) => ['organizer', 'event', id] as const,
  staff: (id: string) => ['organizer', 'event', id, 'staff'] as const,
  sales: (id: string, query: SalesQuery) => ['organizer', 'event', id, 'sales', query] as const,
  orders: (id: string, status: OrderStatus | null) => ['organizer', 'event', id, 'orders', status] as const,
  waitingRoom: (id: string) => ['organizer', 'event', id, 'waiting-room'] as const,
}

export const ORDERS_PAGE_SIZE = 25

export interface SalesQuery {
  groupBy: SalesGroupBy
  /** null: BE tự chọn (theo ngày tăng dần khi gom theo ngày, còn lại doanh thu giảm dần). */
  sort: SalesSort | null
  direction: SortDirection | null
}

export function useVenues() {
  return useQuery({
    queryKey: keys.venues,
    queryFn: async ({ signal }) => unwrap(await coreApi.GET('/organizer/venues', { signal })) as OrganizerVenue[],
  })
}

export function useCreateVenue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; address: string; city: string }) =>
      unwrap(await coreApi.POST('/organizer/venues', { body })) as OrganizerVenue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.venues }),
  })
}

export function useOrganizerEvents() {
  return useQuery({
    queryKey: keys.events,
    queryFn: async ({ signal }) => unwrap(await coreApi.GET('/organizer/events', { signal })) as OrganizerEvent[],
  })
}

export function useOrganizerEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: keys.event(eventId ?? ''),
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/organizer/events/{eventId}', { params: { path: { eventId: eventId! } }, signal }),
      ) as OrganizerEventDetail,
    enabled: Boolean(eventId),
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: EventRequest) =>
      unwrap(await coreApi.POST('/organizer/events', { body })) as OrganizerEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.events }),
  })
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: EventRequest) =>
      unwrap(
        await coreApi.PUT('/organizer/events/{eventId}', { params: { path: { eventId } }, body }),
      ) as OrganizerEvent,
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

export function usePublishEvent(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      unwrap(
        await coreApi.POST('/organizer/events/{eventId}/publish', { params: { path: { eventId } } }),
      ) as OrganizerEvent,
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

export function useAddTicketType(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: TicketTypeRequest) =>
      unwrap(
        await coreApi.POST('/organizer/events/{eventId}/ticket-types', { params: { path: { eventId } }, body }),
      ) as OrganizerTicketType,
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

export function useAddSeats(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: SeatSectionRequest) =>
      unwrap(
        await coreApi.POST('/organizer/events/{eventId}/seats', { params: { path: { eventId } }, body }),
      ) as { created: number },
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

/**
 * Đổi giá loại vé, được cả khi đang bán (M6): chỉ áp dụng cho đơn tạo sau đó, đơn cũ giữ giá lúc mua. Được ghi vào
 * lịch sử thao tác.
 */
export function useChangePrice(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketTypeId, price }: { ticketTypeId: string; price: number }) =>
      unwrap(
        await coreApi.PUT('/organizer/events/{eventId}/ticket-types/{ticketTypeId}/price', {
          params: { path: { eventId, ticketTypeId } },
          body: { price },
        }),
      ) as OrganizerTicketType,
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

/** Bật phòng chờ với `admitPerSecond` người vào mỗi giây, hoặc tắt (`null`). Đổi được cả khi đang bán (M5). */
export function useSetWaitingRoom(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (admitPerSecond: number | null) =>
      unwrap(
        await coreApi.PUT('/organizer/events/{eventId}/waiting-room', {
          params: { path: { eventId } },
          body: { admitPerSecond: admitPerSecond ?? undefined },
        }),
      ) as OrganizerEvent,
    onSuccess: () => {
      invalidateEvent(queryClient, eventId)
      queryClient.invalidateQueries({ queryKey: keys.waitingRoom(eventId) })
    },
  })
}

/** Số người đang chờ và đã được vào (vé vào cửa còn hạn), làm mới mỗi 5 giây khi đang mở. */
export function useWaitingRoomStats(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.waitingRoom(eventId),
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/organizer/events/{eventId}/waiting-room', { params: { path: { eventId } }, signal }),
      ) as WaitingRoomStats,
    enabled,
    refetchInterval: 5_000,
  })
}

/** Nhân viên soát vé của sự kiện, kèm email và tên (core hỏi identity-service). */
export function useStaff(eventId: string) {
  return useQuery({
    queryKey: keys.staff(eventId),
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/organizer/events/{eventId}/staff', { params: { path: { eventId } }, signal }),
      ) as StaffMember[],
  })
}

export function useAssignStaff(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) =>
      unwrap(
        await coreApi.POST('/organizer/events/{eventId}/staff', { params: { path: { eventId } }, body: { email } }),
      ),
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

export function useRemoveStaff(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrap(
        await coreApi.DELETE('/organizer/events/{eventId}/staff/{userId}', { params: { path: { eventId, userId } } }),
      ),
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

/**
 * Báo cáo doanh thu từ bảng tổng hợp của core (chậm hơn thực tế vài giây). Đổi cách gom vẫn giữ số liệu cũ trên màn
 * hình cho tới khi có số mới.
 */
export function useSalesReport(eventId: string, query: SalesQuery) {
  return useQuery({
    queryKey: keys.sales(eventId, query),
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/organizer/events/{eventId}/sales', {
          params: {
            path: { eventId },
            query: { groupBy: query.groupBy, sort: query.sort ?? undefined, direction: query.direction ?? undefined },
          },
          signal,
        }),
      ) as SalesReport,
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })
}

/** Đơn của sự kiện, mới trước, phân trang keyset: mỗi lần "Xem thêm" gửi `nextCursor` của trang trước. */
export function useOrganizerOrders(eventId: string, status: OrderStatus | null) {
  return useInfiniteQuery({
    queryKey: keys.orders(eventId, status),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      unwrap(
        await coreApi.GET('/organizer/events/{eventId}/orders', {
          params: {
            path: { eventId },
            query: { status: status ?? undefined, cursor: pageParam ?? undefined, limit: ORDERS_PAGE_SIZE },
          },
          signal,
        }),
      ) as OrganizerOrderPage,
    getNextPageParam: (page) => page.nextCursor,
  })
}

/**
 * Nhập ghế từ file CSV: gửi nguyên văn nội dung file. File có lỗi thì BE trả 422 SEAT_IMPORT_INVALID kèm `errors`
 * (dòng, lý do) và không thêm ghế nào.
 */
export function useImportSeats(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (csv: string) =>
      unwrap(
        await coreApi.POST('/organizer/events/{eventId}/seats/import', {
          params: { path: { eventId } },
          body: csv,
          bodySerializer: (body) => body,
          headers: { 'Content-Type': 'text/csv' },
        }),
      ) as SeatImportResult,
    onSuccess: () => invalidateEvent(queryClient, eventId),
  })
}

export type CsvExport = 'attendees' | 'checkins'

/**
 * Tải file CSV (cần access token nên không dùng link thường) rồi lưu xuống máy. `from`, `to` (YYYY-MM-DD theo múi
 * giờ sự kiện) chỉ dùng cho lịch sử soát vé.
 */
export function useDownloadCsv(eventId: string) {
  return useMutation({
    mutationFn: async ({ kind, from, to }: { kind: CsvExport; from?: string; to?: string }) => {
      const result =
        kind === 'attendees'
          ? await coreApi.GET('/organizer/events/{eventId}/attendees.csv', {
              params: { path: { eventId } },
              parseAs: 'blob',
            })
          : await coreApi.GET('/organizer/events/{eventId}/checkins.csv', {
              params: { path: { eventId }, query: { from, to } },
              parseAs: 'blob',
            })
      const blob = unwrap(result) as Blob
      saveBlob(blob, filenameFrom(result.response.headers.get('Content-Disposition'), `${kind}.csv`))
      return blob.size
    },
  })
}

function invalidateEvent(queryClient: ReturnType<typeof useQueryClient>, eventId: string) {
  queryClient.invalidateQueries({ queryKey: keys.event(eventId) })
  queryClient.invalidateQueries({ queryKey: keys.events })
  // Trang công khai của sự kiện (giá, số vé còn) cũng đổi
  queryClient.invalidateQueries({ queryKey: ['event', eventId] })
}
