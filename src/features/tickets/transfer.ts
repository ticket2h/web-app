import type { Ticket } from '../../shared/api/types'

/** Core không cho chuyển nhượng trong 2 giờ trước giờ diễn (`ticket2h.ticket.transfer-cutoff`). */
export const TRANSFER_CUTOFF_MS = 2 * 60 * 60 * 1000

/** Lý do vé không chuyển nhượng được, hoặc null nếu được. BE vẫn kiểm tra lại (TICKET_NOT_TRANSFERABLE). */
export function transferBlockedReason(ticket: Pick<Ticket, 'status' | 'eventStartsAt'>, now = Date.now()): string | null {
  if (ticket.status === 'USED') return 'Vé đã được sử dụng'
  if (ticket.status === 'VOID') return 'Vé đã bị huỷ'
  if (new Date(ticket.eventStartsAt).getTime() - now < TRANSFER_CUTOFF_MS) {
    return 'Không chuyển nhượng trong 2 giờ trước giờ diễn'
  }
  return null
}
