import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coreApi, identityApi } from '../../shared/api/client'
import type { CoreAuditAction, IdentityAuditAction } from './audit'
import { unwrap } from '../../shared/api/problem'
import type { AuditLogPage, CreateUserRequest, Organizer, Role, User, UserPage } from '../../shared/api/types'
import type { AuditSource } from './audit'

export const USERS_PAGE_SIZE = 20

/** Chỉ tài khoản ADMIN gọi được (identity-service kiểm tra). */
export function useOrganizers() {
  return useQuery({
    queryKey: ['admin', 'organizers'],
    queryFn: async ({ signal }) => unwrap(await identityApi.GET('/admin/organizers', { signal })) as Organizer[],
  })
}

export function useCreateOrganizer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) =>
      unwrap(await identityApi.POST('/admin/organizers', { body: { name } })) as Organizer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'organizers'] }),
  })
}

/**
 * Tài khoản, mới tạo trước, phân trang keyset (2 triệu tài khoản: OFFSET ở trang sâu rất chậm, ADR-018 ở
 * core-service). Mỗi lần "Xem thêm" gửi `nextCursor` của trang trước; không có tổng số tài khoản.
 */
export function useUsers(filter: { role: Role | null; q: string }) {
  return useInfiniteQuery({
    queryKey: ['admin', 'users', filter],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      unwrap(
        await identityApi.GET('/admin/users', {
          params: {
            query: {
              role: filter.role ?? undefined,
              q: filter.q || undefined,
              cursor: pageParam ?? undefined,
              limit: USERS_PAGE_SIZE,
            },
          },
          signal,
        }),
      ) as UserPage,
    getNextPageParam: (page) => page.nextCursor,
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateUserRequest) => unwrap(await identityApi.POST('/admin/users', { body })) as User,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const AUDIT_PAGE_SIZE = 50

/**
 * Lịch sử thao tác của một service, mới nhất trước, phân trang keyset (M6, ADR-023 ở infra). core: thao tác của ban
 * tổ chức và job tiền; identity: admin tạo tài khoản, sự kiện bảo mật. `action` null: mọi thao tác.
 */
export function useAuditLogs(source: AuditSource, action: string | null) {
  return useInfiniteQuery({
    queryKey: ['admin', 'audit-logs', source, action],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const query = { cursor: pageParam ?? undefined, limit: AUDIT_PAGE_SIZE }
      // `action` đã được AuditTab lọc theo danh sách thao tác của đúng nguồn (AUDIT_ACTIONS)
      const result =
        source === 'core'
          ? await coreApi.GET('/admin/audit-logs', {
              params: { query: { ...query, action: (action ?? undefined) as CoreAuditAction | undefined } },
              signal,
            })
          : await identityApi.GET('/admin/audit-logs', {
              params: { query: { ...query, action: (action ?? undefined) as IdentityAuditAction | undefined } },
              signal,
            })
      return unwrap(result) as AuditLogPage
    },
    getNextPageParam: (page) => page.nextCursor,
    placeholderData: keepPreviousData,
  })
}
