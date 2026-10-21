import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { identityApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { CreateUserRequest, Organizer, Role, User, UserPage } from '../../shared/api/types'

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
