import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { EventPage } from '../../shared/api/types'

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
