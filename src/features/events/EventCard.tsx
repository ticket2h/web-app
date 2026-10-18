import { CalendarDays, MapPin } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle, Text } from 'momi-ui'

import type { EventSummary } from '../../shared/api/types'
import { formatEventTime, saleStatus } from './format'

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Card className="h-full" data-testid="event-card">
      <CardHeader>
        <SaleBadge event={event} />
        <CardTitle className="line-clamp-2 text-lg">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Text size="sm" tone="muted" className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          {formatEventTime(event.startsAt, event.timeZone)}
        </Text>
        <Text size="sm" tone="muted" className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venueName} · {event.city}
          </span>
        </Text>
      </CardContent>
    </Card>
  )
}

function SaleBadge({ event }: { event: EventSummary }) {
  const status = saleStatus(event)
  switch (status.kind) {
    case 'onSale':
      return (
        <Badge tone="success" dot className="self-start">
          Đang mở bán
        </Badge>
      )
    case 'upcoming':
      return (
        <Badge tone="info" className="self-start">
          Mở bán {formatEventTime(event.saleOpensAt, event.timeZone)}
        </Badge>
      )
    case 'closed':
      return (
        <Badge tone="neutral" className="self-start">
          Đã đóng bán
        </Badge>
      )
  }
}
