import { ArrowLeft, MapPin } from 'lucide-react'
import { Button, Card, CardContent, Container, Skeleton } from 'momi-ui'
import { Link, useNavigate } from 'react-router'

import { EmptyState } from '../../shared/ui/EmptyState'
import { PageHeader } from '../../shared/ui/PageHeader'
import { QueryError } from '../../shared/ui/QueryError'
import { useCreateEvent, useVenues } from './api'
import { EventForm } from './EventForm'
import { DEFAULT_EVENT_ZONE, formDefaults } from './eventForm'
import { VenueDialog } from './VenueDialog'

export function NewEventPage() {
  const venues = useVenues()
  const create = useCreateEvent()
  const navigate = useNavigate()

  return (
    <Container size="md" className="py-10">
      <Button asChild variant="link" tone="neutral" leftIcon={<ArrowLeft className="size-4" />} className="mb-6 px-0">
        <Link to="/organizer">Sự kiện của bạn</Link>
      </Button>
      <PageHeader
        eyebrow="Ban tổ chức"
        title="Tạo sự kiện"
        description="Sự kiện được tạo ở dạng nháp. Bước sau: thêm loại vé, xếp ghế, rồi công bố."
      />
      {venues.isPending && <Skeleton className="h-96 rounded-xl" />}
      {venues.isError && <QueryError title="Không tải được địa điểm" error={venues.error} onRetry={() => venues.refetch()} />}
      {venues.data?.length === 0 && (
        <EmptyState
          icon={<MapPin />}
          title="Thêm địa điểm trước"
          description="Sự kiện nào cũng cần một địa điểm tổ chức."
          action={<VenueDialog trigger={<Button>Thêm địa điểm</Button>} />}
        />
      )}
      {venues.data && venues.data.length > 0 && (
        <Card padding="lg">
          <CardContent>
            <EventForm
              defaultValues={formDefaults()}
              timeZone={DEFAULT_EVENT_ZONE}
              venues={venues.data}
              submitLabel="Tạo sự kiện nháp"
              submitting={create.isPending}
              error={create.error}
              onSubmit={(request) =>
                create.mutate(request, { onSuccess: (event) => navigate(`/organizer/events/${event.id}`) })
              }
            />
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
