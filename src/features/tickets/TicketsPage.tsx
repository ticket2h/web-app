import { useQueries } from '@tanstack/react-query'
import { MapPin, QrCode, TicketX } from 'lucide-react'
import { Badge, Button, cn, Container, Heading, Skeleton, Text } from 'momi-ui'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import type { EventDetail, Ticket } from '../../shared/api/types'
import { formatDateTime, formatEventTime } from '../../shared/format/time'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PageHeader } from '../../shared/ui/PageHeader'
import { PosterArt } from '../../shared/ui/PosterArt'
import { QueryError } from '../../shared/ui/QueryError'
import { TicketStatusBadge } from '../../shared/ui/status'
import { eventQuery } from '../events/api'
import { useMyTickets } from './api'
import { TicketDialog } from './TicketDialog'

/** Giờ diễn hiển thị theo múi giờ của sự kiện; vé chưa kịp có thông tin sự kiện thì tạm theo giờ Việt Nam. */
const FALLBACK_ZONE = 'Asia/Ho_Chi_Minh'

export function TicketsPage() {
  const tickets = useMyTickets()
  const [params, setParams] = useSearchParams()
  const orderFilter = params.get('order')
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  const all = tickets.data ?? []
  const shown = orderFilter ? all.filter((t) => t.orderId === orderFilter) : all
  const groups = groupByEvent(shown)
  const events = useQueries({
    queries: groups.map((g) => eventQuery(g.eventId)),
    combine: (results) => new Map(results.flatMap((r) => (r.data ? [[r.data.id, r.data] as const] : []))),
  })
  const openTicket = all.find((t) => t.ticketId === openTicketId) ?? null
  const validCount = all.filter((t) => t.status === 'VALID').length
  const usedCount = all.filter((t) => t.status === 'USED').length
  const eventCount = new Set(all.map((t) => t.eventId)).size

  return (
    <>
      {/* Dải đầu trang nhuốm màu son, chấm bi nhạt dần: tiêu đề và tóm tắt số vé */}
      <section className="relative isolate overflow-hidden border-b border-primary/10 bg-primary/[0.06]">
        <div className="pattern-dots absolute inset-0 -z-10 text-primary/25" aria-hidden />
        <Container size="xl" className="py-10">
          <PageHeader
            eyebrow="Tài khoản"
            title="Vé của tôi"
            description="Đưa mã QR cho nhân viên soát vé ở cổng. Vé đã chuyển nhượng cho người khác không còn ở đây."
            className="mb-0"
          />
          {tickets.data && all.length > 0 && (
            <ul aria-label="Tóm tắt" className="mt-6 flex flex-wrap gap-2 text-sm">
              <SummaryChip value={validCount} label="vé còn hiệu lực" />
              <SummaryChip value={eventCount} label="sự kiện" />
              {usedCount > 0 && <SummaryChip value={usedCount} label="vé đã dùng" />}
            </ul>
          )}
        </Container>
      </section>

      <Container size="xl" className="py-10">
      {orderFilter && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge variant="outline" shape="rounded" className="font-mono">
            Vé của đơn #{orderFilter.slice(0, 8)}
          </Badge>
          <Button variant="link" size="sm" className="px-0" onClick={() => setParams({})}>
            Xem tất cả vé
          </Button>
        </div>
      )}

      {tickets.isPending && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}
      {tickets.isError && (
        <QueryError title="Không tải được vé" error={tickets.error} onRetry={() => tickets.refetch()} />
      )}
      {tickets.data && shown.length === 0 && (
        <EmptyState
          icon={<TicketX />}
          title={orderFilter ? 'Đơn này chưa có vé' : 'Bạn chưa có vé nào'}
          description={
            orderFilter
              ? 'Vé được xuất vài giây sau khi thanh toán thành công.'
              : 'Mua vé ở trang sự kiện, vé sẽ hiện ở đây ngay sau khi thanh toán.'
          }
          action={
            <Button asChild>
              <Link to="/">Xem sự kiện</Link>
            </Button>
          }
        />
      )}

      <div className="flex flex-col gap-12">
        {groups.map((group) => {
          const event = events.get(group.eventId)
          return (
            <section key={group.eventId} aria-labelledby={`event-${group.eventId}`}>
              <EventHeading group={group} event={event} />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.tickets.map((ticket) => (
                  <TicketStub
                    key={ticket.ticketId}
                    ticket={ticket}
                    timeZone={event?.timeZone ?? FALLBACK_ZONE}
                    onOpen={() => setOpenTicketId(ticket.ticketId)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {openTicket && (
        <TicketDialog
          ticket={openTicket}
          event={events.get(openTicket.eventId)}
          open
          onOpenChange={(open) => !open && setOpenTicketId(null)}
        />
      )}
      </Container>
    </>
  )
}

/** Một ô tóm tắt trên dải đầu trang: con số đậm và nhãn. */
function SummaryChip({ value, label }: { value: number; label: string }) {
  return (
    <li className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-card px-3.5 text-muted-foreground">
      <span className="font-bold text-foreground tabular-nums">{value}</span> {label}
    </li>
  )
}

interface EventGroup {
  eventId: string
  title: string
  startsAt: string
  tickets: Ticket[]
}

/** Gom vé theo sự kiện, sự kiện sắp diễn trước; vé hết hiệu lực xuống cuối nhóm. */
function groupByEvent(tickets: Ticket[]): EventGroup[] {
  const groups = new Map<string, EventGroup>()
  for (const ticket of tickets) {
    const group = groups.get(ticket.eventId) ?? {
      eventId: ticket.eventId,
      title: ticket.eventTitle,
      startsAt: ticket.eventStartsAt,
      tickets: [],
    }
    group.tickets.push(ticket)
    groups.set(ticket.eventId, group)
  }
  const rank = (t: Ticket) => (t.status === 'VALID' ? 0 : 1)
  return [...groups.values()]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((g) => ({ ...g, tickets: g.tickets.sort((a, b) => rank(a) - rank(b)) }))
}

function EventHeading({ group, event }: { group: EventGroup; event: EventDetail | undefined }) {
  return (
    <div className="flex items-center gap-4">
      <PosterArt
        seed={group.eventId}
        title={group.title}
        startsAt={group.startsAt}
        timeZone={event?.timeZone ?? FALLBACK_ZONE}
        variant="mini"
        className="size-14 shrink-0 rounded-lg"
      />
      <div className="min-w-0">
        <Heading as="h2" size="xl" id={`event-${group.eventId}`} className="truncate">
          <Link to={`/events/${group.eventId}`} className="hover:text-primary">
            {group.title}
          </Link>
        </Heading>
        <Text size="sm" tone="muted" className="flex flex-wrap items-center gap-x-2">
          {formatEventTime(group.startsAt, event?.timeZone ?? FALLBACK_ZONE)}
          {event && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {event.venue.name}
            </span>
          )}
        </Text>
      </div>
    </div>
  )
}

function TicketStub({ ticket, timeZone, onOpen }: { ticket: Ticket; timeZone: string; onOpen: () => void }) {
  const valid = ticket.status === 'VALID'
  return (
    <article
      data-testid="ticket"
      className={cn(
        'ticket-notch flex overflow-hidden rounded-xl border bg-card shadow-xs [--tear:calc(100%-7.5rem)]',
        !valid && 'opacity-70',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-[0.12em]">
              {ticket.ticketType}
            </Text>
            <div className="mt-1 whitespace-nowrap text-2xl font-bold leading-tight">
              {ticket.seat ?? 'Vé đứng'}
            </div>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>
        <Text size="xs" tone="muted">
          {ticket.status === 'USED' && ticket.checkedInAt
            ? `Đã vào cổng ${ticket.checkedInGate ?? ''} lúc ${formatEventTime(ticket.checkedInAt, timeZone)}`
            : `Xuất vé lúc ${formatDateTime(ticket.issuedAt)}`}
        </Text>
      </div>
      <div className="flex w-30 shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed p-4">
        <Button
          variant={valid ? 'solid' : 'outline'}
          size="sm"
          leftIcon={<QrCode className="size-4" />}
          onClick={onOpen}
          aria-label={`Xem vé ${ticket.seat ?? ticket.ticketType}`}
        >
          {valid ? 'Mã QR' : 'Chi tiết'}
        </Button>
        <span className="font-mono text-[0.65rem] text-muted-foreground">#{ticket.ticketId.slice(0, 8)}</span>
      </div>
    </article>
  )
}
