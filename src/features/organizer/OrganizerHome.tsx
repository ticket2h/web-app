import { CalendarPlus, MapPin, Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  DataTable,
  Grid,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  type DataTableColumnDef,
} from 'momi-ui'
import { Link, useSearchParams } from 'react-router'

import type { OrganizerEvent, OrganizerVenue } from '../../shared/api/types'
import { formatEventTime } from '../../shared/format/time'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PageHeader } from '../../shared/ui/PageHeader'
import { QueryError } from '../../shared/ui/QueryError'
import { EventStatusBadge } from '../../shared/ui/status'
import { useOrganizerEvents, useVenues } from './api'
import { VenueDialog } from './VenueDialog'

export function OrganizerHome() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'venues' ? 'venues' : 'events'

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Ban tổ chức"
        title="Sự kiện của bạn"
        description="Tạo sự kiện ở dạng nháp, thêm loại vé và sơ đồ ghế, rồi công bố để mở bán."
        actions={
          <>
            <VenueDialog
              trigger={
                <Button variant="outline" leftIcon={<MapPin className="size-4" />}>
                  Thêm địa điểm
                </Button>
              }
            />
            <Button asChild leftIcon={<CalendarPlus className="size-4" />}>
              <Link to="/organizer/events/new">Tạo sự kiện</Link>
            </Button>
          </>
        }
      />
      <Tabs value={tab} onValueChange={(value) => setParams(value === 'events' ? {} : { tab: value })}>
        <TabsList>
          <TabsTrigger value="events">Sự kiện</TabsTrigger>
          <TabsTrigger value="venues">Địa điểm</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="pt-6">
          <EventsTab />
        </TabsContent>
        <TabsContent value="venues" className="pt-6">
          <VenuesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EventsTab() {
  const events = useOrganizerEvents()
  const venues = useVenues()
  const venueById = new Map((venues.data ?? []).map((v) => [v.id, v]))

  if (events.isPending) return <Skeleton className="h-64 rounded-xl" />
  if (events.isError) {
    return <QueryError title="Không tải được sự kiện" error={events.error} onRetry={() => events.refetch()} />
  }
  if (events.data.length === 0) {
    return (
      <EmptyState
        icon={<CalendarPlus />}
        title="Chưa có sự kiện nào"
        description="Bắt đầu bằng một sự kiện nháp: chưa ai thấy nó cho tới khi bạn công bố."
        action={
          <Button asChild>
            <Link to="/organizer/events/new">Tạo sự kiện</Link>
          </Button>
        }
      />
    )
  }

  const columns: DataTableColumnDef<OrganizerEvent>[] = [
    {
      id: 'title',
      header: 'Sự kiện',
      accessor: 'title',
      sortable: true,
      width: 360,
      cell: ({ row }) => (
        <Link to={`/organizer/events/${row.id}`} className="font-medium hover:text-primary">
          {row.title}
        </Link>
      ),
    },
    { id: 'status', header: 'Trạng thái', accessor: 'status', width: 150, cell: ({ row }) => <EventStatusBadge status={row.status} /> },
    {
      id: 'startsAt',
      header: 'Giờ diễn',
      accessor: 'startsAt',
      sortable: true,
      width: 220,
      cell: ({ row }) => formatEventTime(row.startsAt, row.timeZone),
    },
    {
      id: 'sale',
      header: 'Đóng bán',
      accessor: 'saleClosesAt',
      width: 220,
      cell: ({ row }) => formatEventTime(row.saleClosesAt, row.timeZone),
    },
    {
      id: 'venue',
      header: 'Địa điểm',
      accessor: (row) => venueById.get(row.venueId)?.name ?? '',
      width: 220,
    },
  ]

  return (
    <DataTable
      aria-label="Sự kiện của ban tổ chức"
      data={events.data}
      columns={columns}
      defaultSort={{ columnId: 'startsAt', direction: 'desc' }}
      variant="card"
    />
  )
}

function VenuesTab() {
  const venues = useVenues()
  if (venues.isPending) return <Skeleton className="h-40 rounded-xl" />
  if (venues.isError) {
    return <QueryError title="Không tải được địa điểm" error={venues.error} onRetry={() => venues.refetch()} />
  }
  if (venues.data.length === 0) {
    return (
      <EmptyState
        icon={<MapPin />}
        title="Chưa có địa điểm"
        description="Cần ít nhất một địa điểm trước khi tạo sự kiện."
        action={<VenueDialog trigger={<Button leftIcon={<Plus className="size-4" />}>Thêm địa điểm</Button>} />}
      />
    )
  }
  return (
    <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
      {venues.data.map((venue: OrganizerVenue) => (
        <Card key={venue.id}>
          <CardContent className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
              <MapPin className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <Text weight="semibold">{venue.name}</Text>
              <Text size="sm" tone="muted">
                {venue.address}, {venue.city}
              </Text>
            </div>
          </CardContent>
        </Card>
      ))}
    </Grid>
  )
}
