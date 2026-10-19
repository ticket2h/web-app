import type { OrderStatus } from '../../shared/api/types'

export type StepState = 'done' | 'current' | 'upcoming' | 'stopped'

export interface OrderStep {
  label: string
  state: StepState
}

/** Ba bước của một đơn: giữ chỗ → thanh toán → xuất vé. Đơn hết hạn hoặc bị huỷ dừng ở bước thanh toán. */
export function orderSteps(status: OrderStatus): OrderStep[] {
  const labels = ['Giữ chỗ', 'Thanh toán', 'Xuất vé'] as const
  const states: Record<OrderStatus, [StepState, StepState, StepState]> = {
    PENDING_PAYMENT: ['done', 'current', 'upcoming'],
    PAID: ['done', 'done', 'current'],
    FULFILLED: ['done', 'done', 'done'],
    EXPIRED: ['done', 'stopped', 'upcoming'],
    CANCELLED: ['done', 'stopped', 'upcoming'],
  }
  return labels.map((label, i) => ({ label, state: states[status][i]! }))
}

/** Kết quả MockPay gửi kèm khi chuyển trình duyệt về (`status=SUCCESS|FAILED`): chỉ để hiển thị, không tin. */
export type PaymentReturn = 'success' | 'failed' | null

export function parsePaymentReturn(value: string | null): PaymentReturn {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'failed'
  return null
}
