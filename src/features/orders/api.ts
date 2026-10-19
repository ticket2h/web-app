import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coreApi } from '../../shared/api/client'
import { unwrap } from '../../shared/api/problem'
import type { Order, OrderSummary, Payment } from '../../shared/api/types'

/**
 * Đơn hàng. Hỏi lại định kỳ khi trạng thái sắp đổi mà không do trình duyệt này làm: chờ webhook của MockPay sau khi
 * thanh toán (`awaitingPayment`), đã PAID chờ phát vé (chạy nền qua Kafka), hoặc chờ hết hạn giữ chỗ.
 */
export function useOrder(orderId: string | undefined, awaitingPayment: boolean) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async ({ signal }) =>
      unwrap(await coreApi.GET('/orders/{orderId}', { params: { path: { orderId: orderId! } }, signal })) as Order,
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'PAID' || (status === 'PENDING_PAYMENT' && awaitingPayment)) return 2_000
      if (status === 'PENDING_PAYMENT') return 15_000
      return false
    },
  })
}

/** 50 đơn gần nhất của người đang đăng nhập. */
export function useMyOrders() {
  return useQuery({
    queryKey: ['me', 'orders'],
    queryFn: async ({ signal }) => unwrap(await coreApi.GET('/me/orders', { signal })) as OrderSummary[],
  })
}

/** Tạo (hoặc lấy lại) phiên thanh toán MockPay, trả `paymentUrl` để chuyển trình duyệt sang trang thanh toán. */
export function useStartPayment() {
  return useMutation({
    mutationFn: async (orderId: string) =>
      unwrap(await coreApi.POST('/orders/{orderId}/payments', { params: { path: { orderId } } })) as Payment,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) =>
      unwrap(await coreApi.POST('/orders/{orderId}/cancel', { params: { path: { orderId } } })) as Order,
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.orderId], order)
      queryClient.invalidateQueries({ queryKey: ['me', 'orders'] })
    },
  })
}
