import { ArrowRight, MapPin } from 'lucide-react'
import { Badge, cn } from 'momi-ui'
import { Link } from 'react-router'

import type { EventSummary } from '../../shared/api/types'
import { eventDateParts, formatEventTime } from '../../shared/format/time'
import { DateChip, posterPalette, PosterPattern } from '../../shared/ui/PosterArt'
import { saleStatus, type SaleStatus } from './format'

/**
 * Ô sự kiện nổi bật (lưới "Tâm điểm" trang chủ): khối màu poster, ô ngày, trạng thái bán vé, tên chữ lớn.
 * `lg` chiếm 2×2 ô lưới, `wide` 2×1, `md` 1×1 (kích thước đặt ở lưới cha).
 */
export function EventTile({ event, size, className }: { event: EventSummary; size: 'lg' | 'md' | 'wide'; className?: string }) {
  const palette = posterPalette(event.id)
  const date = eventDateParts(event.startsAt, event.timeZone)
  return (
    <Link
      to={`/events/${event.id}`}
      data-testid="event-tile"
      className={cn(
        'group relative isolate flex min-h-60 flex-col justify-between gap-6 overflow-hidden rounded-2xl outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        size === 'lg' ? 'p-7' : 'p-5',
        palette.surface,
        className,
      )}
    >
      <PosterPattern seed={event.id} />
      <div className="flex items-start justify-between gap-3">
        <DateChip day={date.day} month={date.month} chip={palette.chip} />
        <SaleBadge sale={saleStatus(event)} timeZone={event.timeZone} onPoster />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {event.venueName} · {event.city} · {date.time}
        </p>
        <h3
          className={cn(
            'mt-2 font-display font-extrabold leading-[0.95] tracking-tighter text-balance',
            size === 'lg' ? 'line-clamp-3 text-4xl uppercase md:text-6xl' : 'line-clamp-2 text-2xl',
          )}
        >
          {event.title}
        </h3>
        {size !== 'md' && (
          <span
            className={cn(
              'mt-5 grid size-12 place-items-center rounded-full transition-transform duration-300 group-hover:-rotate-45',
              palette.chip,
            )}
            aria-hidden
          >
            <ArrowRight className="size-5" strokeWidth={2.2} />
          </span>
        )}
      </div>
    </Link>
  )
}

/** Một dòng trong lịch diễn: ô ngày, tên, địa điểm và giờ, trạng thái, nút xem vé. Cả dòng là một link. */
export function EventRow({ event }: { event: EventSummary }) {
  const date = eventDateParts(event.startsAt, event.timeZone)
  const sale = saleStatus(event)
  return (
    <Link
      to={`/events/${event.id}`}
      data-testid="event-card"
      className={cn(
        'group flex flex-wrap items-center gap-x-7 gap-y-3 rounded-2xl border bg-card px-5 py-4 outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring',
        sale.kind === 'closed' && 'opacity-70',
      )}
    >
      <div className="w-16 shrink-0 text-center leading-none">
        <div className="font-display text-3xl font-bold tracking-tighter">{date.day}</div>
        <div className="mt-1.5 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground">{date.month}</div>
      </div>
      <div className="min-w-0 flex-[1_1_18rem]">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight group-hover:underline group-hover:underline-offset-4">
          {event.title}
        </h3>
        <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venueName} · {event.city} · {date.time}
          </span>
        </p>
      </div>
      <SaleBadge sale={sale} timeZone={event.timeZone} />
      <span
        aria-hidden
        className={cn(
          'inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-bold transition-colors',
          sale.kind === 'onSale'
            ? 'bg-primary text-primary-foreground'
            : 'border border-input text-muted-foreground group-hover:text-foreground',
        )}
      >
        {sale.kind === 'onSale' ? 'Mua vé' : 'Xem'}
        <ArrowRight className="size-4" strokeWidth={2.2} />
      </span>
    </Link>
  )
}

/**
 * Nhãn trạng thái bán vé. `onPoster`: nền trắng đặc để đọc được trên mọi màu poster; chấm màu cho biết trạng thái.
 */
export function SaleBadge({
  sale,
  timeZone,
  onPoster,
  className,
}: {
  sale: SaleStatus
  timeZone: string
  onPoster?: boolean
  className?: string
}) {
  const surface = onPoster && 'border-transparent bg-white text-neutral-900'
  switch (sale.kind) {
    case 'onSale':
      return (
        <Badge tone="success" dot className={cn(surface, className)}>
          Đang mở bán
        </Badge>
      )
    case 'upcoming':
      return (
        <Badge tone="info" dot className={cn(surface, className)}>
          Mở bán {formatEventTime(sale.opensAt.toISOString(), timeZone)}
        </Badge>
      )
    case 'closed':
      return (
        <Badge tone="neutral" dot className={cn(surface, className)}>
          Đã đóng bán
        </Badge>
      )
  }
}
