import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { Ticket } from '../../shared/api/types'

/** Vé đang sở hữu (vé đã chuyển cho người khác không còn ở đây). */
export function useMyTickets() {
  return useQuery({
    queryKey: ['me', 'tickets'],
    queryFn: async ({ signal }) => unwrap(await coreApi.GET('/me/tickets', { signal })) as Ticket[],
  })
}

/**
 * Ảnh QR của vé (PNG, cần access token nên không đặt thẳng vào `<img src>`). Không giữ trong cache: QR là thứ để vào
 * cổng, đóng hộp thoại là bỏ. Trả URL `blob:` dùng cho `<img>`, tự thu hồi khi đổi vé hoặc đóng.
 */
export function useTicketQr(ticketId: string, enabled: boolean) {
  const qr = useQuery({
    queryKey: ['ticket', ticketId, 'qr'],
    queryFn: async ({ signal }) =>
      unwrap(
        await coreApi.GET('/tickets/{ticketId}/qr', {
          params: { path: { ticketId } },
          parseAs: 'blob',
          signal,
        }),
      ) as Blob,
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  })
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!qr.data) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(qr.data)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [qr.data])
  return { ...qr, url }
}

/** Chuyển vé cho một tài khoản khách hàng khác. QR cũ hết hiệu lực ngay, người nhận nhận email có QR mới. */
export function useTransferTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, recipientEmail }: { ticketId: string; recipientEmail: string }) =>
      unwrap(
        await coreApi.POST('/tickets/{ticketId}/transfer', {
          params: { path: { ticketId } },
          body: { recipientEmail },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'tickets'] }),
  })
}

/**
 * Chỉ khi chạy dev (core profile dev): chuỗi token trong QR, để thử soát vé khi máy không có camera.
 * Bản build cho người dùng không có nút này.
 */
export function useDevQrToken() {
  return useMutation({
    mutationFn: async (ticketId: string) =>
      (unwrap(await coreApi.GET('/dev/tickets/{ticketId}/qr-token', { params: { path: { ticketId } } })) as { qrToken: string })
        .qrToken,
  })
}
