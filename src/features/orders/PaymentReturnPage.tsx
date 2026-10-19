import { Navigate, useSearchParams } from 'react-router'

/**
 * MockPay chuyển trình duyệt về `/payments/return?orderId=...&merchantRef=...&status=SUCCESS|FAILED` (core gắn
 * `orderId` vào return-url của từng phiên). `status` không có chữ ký nên chỉ dùng để chọn lời nhắn; trạng thái thật
 * do webhook đổi, trang đơn hàng tự hỏi lại tới khi có kết quả.
 */
export function PaymentReturnPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return <Navigate to="/me/orders" replace />
  }
  const result = params.get('status') === 'SUCCESS' ? 'success' : 'failed'
  return <Navigate to={`/orders/${orderId}?payment=${result}`} replace />
}
