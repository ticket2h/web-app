import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Copy, Send } from 'lucide-react'
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Skeleton,
  Text,
  toast,
} from 'momi-ui'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { EventDetail, Ticket } from '../../shared/api/types'
import { formatEventTime } from '../../shared/format/time'
import { TicketStatusBadge } from '../../shared/ui/status'
import { useDevQrToken, useTicketQr, useTransferTicket } from './api'
import { transferBlockedReason } from './transfer'

interface TicketDialogProps {
  ticket: Ticket
  event: EventDetail | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDialog({ ticket, event, open, onOpenChange }: TicketDialogProps) {
  const [view, setView] = useState<'qr' | 'transfer'>('qr')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        {view === 'qr' ? (
          <QrView ticket={ticket} event={event} onTransfer={() => setView('transfer')} />
        ) : (
          <TransferView ticket={ticket} onBack={() => setView('qr')} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function QrView({ ticket, event, onTransfer }: { ticket: Ticket; event: EventDetail | undefined; onTransfer: () => void }) {
  const valid = ticket.status === 'VALID'
  const qr = useTicketQr(ticket.ticketId, valid)
  const blocked = transferBlockedReason(ticket)

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ticket.eventTitle}</DialogTitle>
        <DialogDescription>
          {event ? `${formatEventTime(ticket.eventStartsAt, event.timeZone)} · ${event.venue.name}` : ticket.ticketType}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4">
        {valid ? (
          // QR luôn nền trắng, cả khi giao diện tối: máy quét cần tương phản
          <div className="grid aspect-square w-full max-w-64 place-items-center rounded-xl bg-white p-3">
            {qr.url ? (
              <img src={qr.url} alt={`Mã QR vé ${ticket.seat ?? ticket.ticketType}`} className="size-full [image-rendering:pixelated]" />
            ) : qr.isError ? (
              <Text size="sm" align="center" className="text-neutral-700">
                {qrError(qr.error)}
              </Text>
            ) : (
              <Skeleton className="size-full" />
            )}
          </div>
        ) : (
          <Alert tone="neutral" variant="soft" className="w-full">
            {ticket.status === 'USED'
              ? `Vé đã được sử dụng${ticket.checkedInGate ? ` tại cổng ${ticket.checkedInGate}` : ''}. Mã QR không còn hiệu lực.`
              : 'Vé đã bị huỷ, mã QR không còn hiệu lực.'}
          </Alert>
        )}

        <div className="grid w-full grid-cols-2 gap-3 rounded-xl border p-4 text-sm">
          <div>
            <Text size="xs" tone="muted">
              Loại vé
            </Text>
            <Text weight="semibold">{ticket.ticketType}</Text>
          </div>
          <div>
            <Text size="xs" tone="muted">
              Chỗ
            </Text>
            <Text weight="semibold">{ticket.seat ?? 'Vé đứng'}</Text>
          </div>
          <div>
            <Text size="xs" tone="muted">
              Trạng thái
            </Text>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <div>
            <Text size="xs" tone="muted">
              Mã vé
            </Text>
            <Text weight="semibold" className="font-mono">
              #{ticket.ticketId.slice(0, 8)}
            </Text>
          </div>
        </div>
        {import.meta.env.DEV && valid && <DevTokenButton ticketId={ticket.ticketId} />}
      </div>

      {valid && (
        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Text size="xs" tone="muted">
            {blocked ?? 'Chuyển vé cho bạn bè có tài khoản Ticket2h.'}
          </Text>
          <Button variant="outline" leftIcon={<Send className="size-4" />} disabled={blocked !== null} onClick={onTransfer}>
            Chuyển nhượng
          </Button>
        </DialogFooter>
      )}
    </>
  )
}

function qrError(error: unknown): string {
  if (error instanceof ApiError && error.code === 'TICKET_NOT_VALID') {
    return 'Vé không còn hiệu lực. Tải lại trang để xem trạng thái mới.'
  }
  return errorMessage(error)
}

/** Chỉ khi chạy `npm run dev`: lấy chuỗi trong QR để dán vào trang soát vé, thay cho camera. */
function DevTokenButton({ ticketId }: { ticketId: string }) {
  const token = useDevQrToken()
  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<Copy className="size-4" />}
      loading={token.isPending}
      onClick={() =>
        token.mutate(ticketId, {
          onSuccess: async (value) => {
            await navigator.clipboard.writeText(value)
            toast.success('Đã chép mã QR (dev). Dán vào trang Soát vé để thử.')
          },
          onError: () => toast.error('Không lấy được mã. Core phải chạy với profile dev.'),
        })
      }
    >
      Chép mã QR dạng chữ (dev)
    </Button>
  )
}

const transferSchema = z.object({
  recipientEmail: z.string().trim().min(1, 'Nhập email người nhận').pipe(z.email('Email không hợp lệ')),
})

function TransferView({ ticket, onBack, onDone }: { ticket: Ticket; onBack: () => void; onDone: () => void }) {
  const transfer = useTransferTicket()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { recipientEmail: '' },
  })

  const onSubmit = handleSubmit(({ recipientEmail }) =>
    transfer.mutate(
      { ticketId: ticket.ticketId, recipientEmail },
      {
        onSuccess: () => {
          toast.success(`Đã chuyển vé cho ${recipientEmail}`)
          onDone()
        },
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Chuyển nhượng vé</DialogTitle>
        <DialogDescription>
          {ticket.ticketType} · {ticket.seat ?? 'Vé đứng'}. Sau khi chuyển, mã QR của bạn hết hiệu lực ngay; người nhận
          nhận email có mã QR mới. Không hoàn tác được.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        {transfer.isError && (
          <Alert tone="danger" variant="soft" role="alert">
            {transferError(transfer.error)}
          </Alert>
        )}
        <FormField label="Email người nhận" error={errors.recipientEmail?.message} required description="Người nhận phải có tài khoản khách hàng Ticket2h.">
          <Input type="email" autoComplete="off" autoFocus {...register('recipientEmail')} />
        </FormField>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>
          Quay lại
        </Button>
        <Button type="submit" loading={transfer.isPending}>
          Chuyển vé
        </Button>
      </DialogFooter>
    </form>
  )
}

function transferError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'RECIPIENT_NOT_FOUND':
        return 'Không có tài khoản khách hàng nào với email này.'
      case 'IDENTITY_UNAVAILABLE':
        return 'Tạm thời không kiểm tra được tài khoản người nhận. Vé chưa bị chuyển, thử lại sau ít phút.'
    }
  }
  return errorMessage(error)
}
