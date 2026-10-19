import { MapPin } from 'lucide-react'
import { Badge, Text } from 'momi-ui'
import { Link } from 'react-router'

import type { EventSummary } from '../../shared/api/types'
import { formatEventTime } from '../../shared/format/time'
import { PosterArt } from '../../shared/ui/PosterArt'
import { saleStatus } from './format'

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      to={`/events/${event.id}`}
      data-testid="event-card"
      className="group flex flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <PosterArt
        seed={event.id}
        title={event.title}
        startsAt={event.startsAt}
        timeZone={event.timeZone}
        city={event.city}
        className="aspect-[4/3] rounded-2xl transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-[-0.6deg]"
      />
      <div className="flex flex-col gap-1.5 px-1 pt-4">
        <SaleBadge event={event} />
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug group-hover:text-primary">
          {event.title}
        </h3>
        <Text size="sm" tone="muted">
          {formatEventTime(event.startsAt, event.timeZone)}
        </Text>
        <Text size="sm" tone="muted" className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venueName} · {event.city}
          </span>
        </Text>
      </div>
    </Link>
  )
}

function SaleBadge({ event }: { event: EventSummary }) {
  const status = saleStatus(event)
  switch (status.kind) {
    case 'onSale':
      return (
        <Badge tone="success" dot size="sm" className="self-start">
          Đang mở bán
        </Badge>
      )
    case 'upcoming':
      return (
        <Badge tone="info" size="sm" className="self-start">
          Mở bán {formatEventTime(event.saleOpensAt, event.timeZone)}
        </Badge>
      )
    case 'closed':
      return (
        <Badge tone="neutral" size="sm" className="self-start">
          Đã đóng bán
        </Badge>
      )
  }
}
