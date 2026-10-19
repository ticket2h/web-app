import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type {
  EventRequest,
  OrganizerEvent,
  OrganizerEventDetail,
  OrganizerTicketType,
  OrganizerVenue,
  SeatSectionRequest,
  StaffMember,
  TicketTypeRequest,
} from '../../shared/api/types'

/** Mọi API ở đây chỉ chạy với tài khoản ORGANIZER và chỉ thấy dữ liệu của ban tổ chức mình (BE kiểm tra). */
const keys = {
  venues: ['organizer', 'venues'] as const,
  events: ['organizer', 'events'] as const,
  event: (id: string) => ['organizer', 'event', id] as const,
  staff: (id: string) => ['organizer', 'event', id, 'staff'] as const,
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

function invalidateEvent(queryClient: ReturnType<typeof useQueryClient>, eventId: string) {
  queryClient.invalidateQueries({ queryKey: keys.event(eventId) })
  queryClient.invalidateQueries({ queryKey: keys.events })
  // Trang công khai của sự kiện (giá, số vé còn) cũng đổi
  queryClient.invalidateQueries({ queryKey: ['event', eventId] })
}
