import { CalendarDays, MapPin } from 'lucide-react'
import { Badge, cn } from 'momi-ui'
import { Link } from 'react-router'

import type { EventSummary } from '../../shared/api/types'
import { formatEventTime } from '../../shared/format/time'
import { PosterArt } from '../../shared/ui/PosterArt'
import { saleStatus, type SaleStatus } from './format'

/** Thẻ sự kiện trong lưới: poster (có nhãn trạng thái bán vé), tên, giờ diễn, địa điểm. */
export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      to={`/events/${event.id}`}
      data-testid="event-card"
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs outline-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-26px_rgb(0_0_0/0.5)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative">
        <PosterArt
          seed={event.id}
          title={event.title}
          startsAt={event.startsAt}
          timeZone={event.timeZone}
          city={event.city}
          className="aspect-[4/3]"
        />
        <SaleBadge sale={saleStatus(event)} timeZone={event.timeZone} className="absolute left-3 top-3" />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 px-4 pb-4 pt-3.5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">
          {event.title}
        </h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {formatEventTime(event.startsAt, event.timeZone)}
        </p>
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venueName} · {event.city}
          </span>
        </p>
      </div>
    </Link>
  )
}

/**
 * Nhãn trạng thái bán vé. Trên poster dùng nền trắng đặc để đọc được trên mọi màu poster; chấm màu cho biết trạng thái.
 */
export function SaleBadge({ sale, timeZone, className }: { sale: SaleStatus; timeZone: string; className?: string }) {
  const surface = 'border-transparent bg-white/95 text-neutral-900 shadow-xs'
  switch (sale.kind) {
    case 'onSale':
      return (
        <Badge tone="success" dot shape="rounded" className={cn(surface, className)}>
          Đang mở bán
        </Badge>
      )
    case 'upcoming':
      return (
        <Badge tone="info" dot shape="rounded" className={cn(surface, className)}>
          Mở bán {formatEventTime(sale.opensAt.toISOString(), timeZone)}
        </Badge>
      )
    case 'closed':
      return (
        <Badge tone="neutral" dot shape="rounded" className={cn(surface, className)}>
          Đã đóng bán
        </Badge>
      )
  }
}
