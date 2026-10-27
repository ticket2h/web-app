import type { paths as CorePaths } from '../../shared/api/generated/core'
import type { paths as IdentityPaths } from '../../shared/api/generated/identity'
import type { AuditLogItem } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'

/** Nguồn lịch sử: mỗi service một bảng riêng (ADR-023 ở infra), web không ghép thành một dòng thời gian. */
export type AuditSource = 'core' | 'identity'

type QueryOf<P> = P extends { get: { parameters: { query?: infer Q } } } ? NonNullable<Q> : never
export type CoreAuditAction = NonNullable<QueryOf<CorePaths['/admin/audit-logs']>['action']>
export type IdentityAuditAction = NonNullable<QueryOf<IdentityPaths['/admin/audit-logs']>['action']>

/**
 * Nhãn tiếng Việt cho thao tác. Kiểu lấy từ OpenAPI: BE thêm thao tác mới (AuditAction của từng service) mà quên
 * nhãn ở đây thì `npm run typecheck` báo lỗi sau khi sinh lại kiểu.
 */
export const AUDIT_ACTIONS: { core: Record<CoreAuditAction, string>; identity: Record<IdentityAuditAction, string> } = {
  core: {
    VENUE_CREATED: 'Tạo địa điểm',
    EVENT_CREATED: 'Tạo sự kiện',
    EVENT_UPDATED: 'Sửa sự kiện',
    EVENT_PUBLISHED: 'Công bố sự kiện',
    WAITING_ROOM_CHANGED: 'Đổi phòng chờ',
    TICKET_TYPE_CREATED: 'Thêm loại vé',
    TICKET_TYPE_PRICE_CHANGED: 'Đổi giá vé',
    SEATS_ADDED: 'Thêm ghế',
    SEATS_IMPORTED: 'Nhập ghế từ file',
    STAFF_ASSIGNED: 'Phân công soát vé',
    STAFF_REMOVED: 'Bỏ phân công soát vé',
    ATTENDEES_EXPORTED: 'Tải danh sách khách',
    CHECKINS_EXPORTED: 'Tải lịch sử soát vé',
    PAYMENT_REFUND_REQUESTED: 'Yêu cầu hoàn tiền',
    PAYMENT_REFUNDED: 'Đã hoàn tiền',
    PAYMENT_AMOUNT_MISMATCH: 'Số tiền thanh toán lệch',
    PAYMENT_RECONCILED: 'Đối soát thanh toán',
  },
  identity: {
    ORGANIZER_CREATED: 'Tạo ban tổ chức',
    USER_CREATED: 'Tạo tài khoản',
    REFRESH_TOKEN_REUSE_DETECTED: 'Refresh token bị dùng lại',
  },
}

const SYSTEM_ACTORS: Record<string, string> = {
  'refund-job': 'Job hoàn tiền',
  'payment-reconciliation': 'Job đối soát thanh toán',
  payments: 'Xử lý thanh toán',
  'refresh-token': 'Kiểm tra refresh token',
}

const EVENT_FIELDS: Record<string, string> = {
  title: 'tiêu đề',
  description: 'mô tả',
  venueId: 'địa điểm',
  startsAt: 'giờ diễn',
  saleOpensAt: 'giờ mở bán',
  saleClosesAt: 'giờ đóng bán',
  maxTicketsPerUser: 'số vé tối đa',
}

/** Thao tác cũ đã bỏ khỏi BE (không còn trong danh sách) thì hiện mã gốc. */
export function actionLabel(source: AuditSource, action: string): string {
  return (AUDIT_ACTIONS[source] as Record<string, string>)[action] ?? action
}

/** Người làm: email (hoặc id nếu tài khoản không còn) với người dùng, tên dễ đọc với hệ thống. */
export function actorLabel(item: AuditLogItem): string {
  const { actor } = item
  if (actor.type === 'SYSTEM') return SYSTEM_ACTORS[actor.name ?? ''] ?? `Hệ thống (${actor.name ?? '?'})`
  return actor.email ?? actor.fullName ?? actor.id ?? 'Không rõ'
}

/** Một dòng tóm tắt `details` cho bảng; thao tác chưa biết thì để trống (vẫn xem được thao tác và người làm). */
export function describe(item: AuditLogItem): string {
  const d = item.details
  const money = (value: unknown) => (typeof value === 'number' ? formatVnd(value) : String(value ?? ''))
  switch (item.action) {
    case 'TICKET_TYPE_PRICE_CHANGED':
      return `${d.name}: ${money(d.from)} → ${money(d.to)}`
    case 'EVENT_CREATED':
    case 'VENUE_CREATED':
    case 'ORGANIZER_CREATED':
      return String(d.title ?? d.name ?? '')
    case 'EVENT_UPDATED': {
      const fields = Object.keys((d.changes as Record<string, unknown> | undefined) ?? {})
      return `Đổi ${fields.map((f) => EVENT_FIELDS[f] ?? f).join(', ')}`
    }
    case 'WAITING_ROOM_CHANGED': {
      const rate = (value: unknown) => (value === null || value === undefined ? 'tắt' : `${value} người/giây`)
      return `${rate(d.from)} → ${rate(d.to)}`
    }
    case 'TICKET_TYPE_CREATED':
      return `${d.name} (${d.kind === 'GA' ? 'vé đứng' : 'vé ngồi'}), ${money(d.price)}`
    case 'SEATS_ADDED':
    case 'SEATS_IMPORTED':
      return `${Number(d.seats ?? 0).toLocaleString('vi-VN')} ghế`
    case 'ATTENDEES_EXPORTED':
    case 'CHECKINS_EXPORTED':
      return `${Number(d.rows ?? 0).toLocaleString('vi-VN')} dòng${d.complete === false ? ', tải dở dang' : ''}`
    case 'PAYMENT_REFUND_REQUESTED':
    case 'PAYMENT_REFUNDED':
      return `${money(d.amount)}${d.reason ? ` · ${d.reason}` : ''}`
    case 'PAYMENT_AMOUNT_MISMATCH':
      return `Cổng báo ${money(d.reported)}, đơn ${money(d.expected)}`
    case 'USER_CREATED':
      return `Vai trò ${String(d.role ?? '')}`
    case 'REFRESH_TOKEN_REUSE_DETECTED':
      return `Thu hồi ${Number(d.revokedTokens ?? 0)} token của phiên đăng nhập`
    default:
      return ''
  }
}
