import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { applyChanges, type SeatChange, type SeatMapData } from './liveSeats'

/** BE cache ảnh chụp tối đa một giây: ảnh chụp tải về còn thiếu thay đổi thì đợi rồi tải lại, tối đa ngần này lần. */
const SNAPSHOT_RETRIES = 5
const SNAPSHOT_RETRY_MS = 1_000

/**
 * Nghe các ghế đổi trạng thái qua SSE (`GET /events/{id}/seats/stream`, ADR-024 của core-service) và áp vào cache
 * của sơ đồ ghế (`queryKey`). Dùng `EventSource` thẳng: openapi-fetch (`coreApi`) không đọc được luồng SSE; đường
 * dẫn công khai nên không cần access token.
 *
 * Ghép với ảnh chụp: `hello` và `resync` mang số thứ tự `seq`; ảnh chụp đang có mà `seq` nhỏ hơn thì có thể thiếu thay
 * đổi xảy ra trước khi nối, nên tải lại. Mất mạng thì trình duyệt tự nối lại và nhận `hello` mới, tức là lại tải đủ.
 * Trả `connected`: đang nhận được thay đổi (không thì trang tải lại định kỳ như trước).
 */
export function useSeatStream(url: string | null, queryKey: QueryKey): { connected: boolean } {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const keyHash = JSON.stringify(queryKey)

  useEffect(() => {
    if (!url || typeof EventSource === 'undefined') return
    const key = JSON.parse(keyHash) as QueryKey
    let required = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let closed = false

    const isFresh = () => {
      const data = queryClient.getQueryData<SeatMapData>(key)
      return data !== undefined && data.seq >= required
    }
    const ensureFresh = (attempt: number) => {
      if (closed || isFresh()) return
      void queryClient.refetchQueries({ queryKey: key, exact: true }).then(() => {
        if (!closed && !isFresh() && attempt + 1 < SNAPSHOT_RETRIES) {
          timer = setTimeout(() => ensureFresh(attempt + 1), SNAPSHOT_RETRY_MS)
        }
      })
    }
    const needSeq = (event: MessageEvent<string>) => {
      required = Math.max(required, (JSON.parse(event.data) as { seq: number }).seq)
      clearTimeout(timer)
      ensureFresh(0)
    }

    const source = new EventSource(url)
    source.addEventListener('hello', (event) => {
      setConnected(true)
      needSeq(event)
    })
    source.addEventListener('resync', needSeq)
    source.addEventListener('seats', (event) => {
      const batch = JSON.parse(event.data) as { seq: number; changes: SeatChange[] }
      queryClient.setQueryData<SeatMapData>(key, (data) =>
        data ? { ...data, seats: applyChanges(data.seats, batch.changes) } : data,
      )
    })
    // Mất kết nối: trình duyệt tự nối lại (nhận hello mới). BE trả 503 (quá nhiều kết nối): không nối lại nữa
    source.onerror = () => setConnected(false)

    return () => {
      closed = true
      clearTimeout(timer)
      source.close()
      setConnected(false)
    }
  }, [url, keyHash, queryClient])

  return { connected }
}
