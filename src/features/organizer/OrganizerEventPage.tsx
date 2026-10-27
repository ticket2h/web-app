import { ArrowLeft, Armchair, CircleCheck, CircleX, ExternalLink, FileUp, Pencil, Plus, Rocket, Ticket } from 'lucide-react'
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  Grid,
  Progress,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  toast,
} from 'momi-ui'
import { Link, useParams, useSearchParams } from 'react-router'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { OrganizerEventDetail, OrganizerTicketType } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { formatEventTime } from '../../shared/format/time'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PageHeader } from '../../shared/ui/PageHeader'
import { QueryError } from '../../shared/ui/QueryError'
import { EventStatusBadge } from '../../shared/ui/status'
import { useEvent, useSeats } from '../events/api'
import { SeatMap } from '../events/SeatMap'
import { useOrganizerEvent, usePublishEvent, useUpdateEvent, useVenues } from './api'
import { EventForm } from './EventForm'
import { formDefaults } from './eventForm'
import { ExportMenu } from './ExportMenu'
import { OrdersPanel } from './OrdersPanel'
import { PriceDialog } from './PriceDialog'
import { SalesPanel } from './SalesPanel'
import { SeatImportDialog } from './SeatImportDialog'
import { SeatsDialog } from './SeatsDialog'
import { publishChecklist } from './seating'
import { StaffPanel } from './StaffPanel'
import { WaitingRoomCard } from './WaitingRoomCard'
import { TicketTypeDialog } from './TicketTypeDialog'

const TABS = ['tickets', 'sales', 'orders', 'staff', 'details'] as const
type Tab = (typeof TABS)[number]

export function OrganizerEventPage() {
  const { eventId } = useParams()
  const detail = useOrganizerEvent(eventId)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="link" tone="neutral" leftIcon={<ArrowLeft className="size-4" />} className="mb-6 px-0">
        <Link to="/organizer">Sự kiện của bạn</Link>
      </Button>
      {detail.isPending && <Skeleton className="h-96 rounded-xl" />}
      {detail.isError &&
        (detail.error instanceof ApiError && (detail.error.code === 'NOT_FOUND' || detail.error.code === 'FORBIDDEN') ? (
          <EmptyState title="Không tìm thấy sự kiện" description="Sự kiện không tồn tại hoặc thuộc ban tổ chức khác." />
        ) : (
          <QueryError title="Không tải được sự kiện" error={detail.error} onRetry={() => detail.refetch()} />
        ))}
      {detail.data && <EventManager detail={detail.data} />}
    </div>
  )
}

function EventManager({ detail }: { detail: OrganizerEventDetail }) {
  const { event } = detail
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t === params.get('tab')) ?? 'tickets'
  const draft = event.status === 'DRAFT'

  return (
    <>
      <PageHeader
        eyebrow="Ban tổ chức"
        title={event.title}
        description={
          <span className="flex flex-wrap items-center gap-3">
            {formatEventTime(event.startsAt, event.timeZone)}
            <EventStatusBadge status={event.status} />
          </span>
        }
        actions={
          draft ? (
            <PublishButton detail={detail} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <ExportMenu event={event} />
              <Button asChild variant="outline" rightIcon={<ExternalLink className="size-4" />}>
                <Link to={`/events/${event.id}`}>Xem trang bán vé</Link>
              </Button>
            </div>
          )
        }
      />
      <Tabs value={tab} onValueChange={(value) => setParams(value === 'tickets' ? {} : { tab: value as Tab })}>
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="tickets">Vé và ghế</TabsTrigger>
          <TabsTrigger value="sales">Doanh thu</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="staff">Nhân viên soát vé</TabsTrigger>
          <TabsTrigger value="details">Thông tin</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="pt-6">
          <TicketsTab detail={detail} />
        </TabsContent>
        <TabsContent value="sales" className="pt-6">
          <SalesPanel eventId={event.id} />
        </TabsContent>
        <TabsContent value="orders" className="pt-6">
          <OrdersPanel eventId={event.id} timeZone={event.timeZone} />
        </TabsContent>
        <TabsContent value="staff" className="pt-6">
          <StaffPanel eventId={event.id} />
        </TabsContent>
        <TabsContent value="details" className="pt-6">
          <DetailsTab detail={detail} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function PublishButton({ detail }: { detail: OrganizerEventDetail }) {
  const publish = usePublishEvent(detail.event.id)
  const checklist = publishChecklist(detail)
  const ready = checklist.every((item) => item.ok)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button leftIcon={<Rocket className="size-4" />} loading={publish.isPending}>
          Công bố
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{ready ? 'Công bố sự kiện?' : 'Chưa công bố được'}</AlertDialogTitle>
          <AlertDialogDescription>
            Sau khi công bố, sự kiện hiện cho mọi người và mở bán theo giờ đã đặt. Không thêm loại vé hay ghế được nữa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="flex flex-col gap-2 py-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.ok ? (
                <CircleCheck className="size-4 text-success" aria-label="Đạt" />
              ) : (
                <CircleX className="size-4 text-destructive" aria-label="Chưa đạt" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>Để sau</AlertDialogCancel>
          <AlertDialogAction
            disabled={!ready}
            onClick={() =>
              publish.mutate(undefined, {
                onSuccess: () => toast.success('Đã công bố. Sự kiện đã hiện trên trang chủ.'),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            Công bố
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function TicketsTab({ detail }: { detail: OrganizerEventDetail }) {
  const { event, ticketTypes } = detail
  const draft = event.status === 'DRAFT'

  const seatedTypes = ticketTypes.filter((t) => t.kind === 'SEATED')

  return (
    <div className="flex flex-col gap-8">
      {!draft && (
        <Alert tone="info" variant="soft">
          Sự kiện đã công bố: không thêm loại vé hay ghế được nữa, để không ảnh hưởng vé đang bán. Giá vé vẫn đổi được
          (đơn đã đặt giữ giá lúc mua).
        </Alert>
      )}
      {draft && seatedTypes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-5 py-4">
          <Text size="sm" tone="muted">
            Sơ đồ lớn (hàng nghìn ghế)? Soạn trong Excel rồi nhập một lần, dòng nào sai sẽ được chỉ ra.
          </Text>
          <SeatImportDialog
            eventId={event.id}
            seatedTypes={seatedTypes}
            trigger={
              <Button variant="outline" size="sm" leftIcon={<FileUp className="size-4" />}>
                Nhập ghế từ file
              </Button>
            }
          />
        </div>
      )}
      {ticketTypes.length === 0 ? (
        <EmptyState
          icon={<Ticket />}
          title="Chưa có loại vé"
          description="Thêm ít nhất một loại vé (vé ngồi hoặc vé đứng) để công bố sự kiện."
          action={
            <TicketTypeDialog eventId={event.id} trigger={<Button leftIcon={<Plus className="size-4" />}>Thêm loại vé</Button>} />
          }
        />
      ) : (
        <Grid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
          {ticketTypes.map((type) => (
            <TicketTypeCard key={type.id} eventId={event.id} type={type} editable={draft} />
          ))}
          {draft && (
            <TicketTypeDialog
              eventId={event.id}
              trigger={
                <button
                  type="button"
                  className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Plus className="size-5" aria-hidden />
                  <span className="text-sm font-medium">Thêm loại vé</span>
                </button>
              }
            />
          )}
        </Grid>
      )}
      <WaitingRoomCard event={event} />
      {!draft && ticketTypes.some((t) => t.kind === 'SEATED') && <PublishedSeatMap eventId={event.id} />}
    </div>
  )
}

function TicketTypeCard({ eventId, type, editable }: { eventId: string; type: OrganizerTicketType; editable: boolean }) {
  const seated = type.kind === 'SEATED'
  const sold = !seated && type.totalQuantity !== null && type.availableQuantity !== null ? type.totalQuantity - type.availableQuantity : 0

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Text weight="semibold" size="lg">
              {type.name}
            </Text>
            <Text tone="muted" className="font-display text-2xl font-bold text-foreground">
              {formatVnd(type.price)}
            </Text>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" tone={seated ? 'info' : 'neutral'}>
              {seated ? 'Vé ngồi' : 'Vé đứng'}
            </Badge>
            <PriceDialog
              eventId={eventId}
              type={type}
              trigger={
                <Button size="xs" variant="ghost" leftIcon={<Pencil className="size-3.5" />}>
                  Đổi giá
                </Button>
              }
            />
          </div>
        </div>
        {seated ? (
          <div className="mt-auto flex items-center justify-between gap-3">
            <Text size="sm" tone={type.seatCount ? 'muted' : 'warning'} className="flex items-center gap-1.5">
              <Armchair className="size-4" aria-hidden />
              {type.seatCount ? `${type.seatCount} ghế` : 'Chưa có ghế'}
            </Text>
            {editable && (
              <SeatsDialog
                eventId={eventId}
                ticketType={type}
                trigger={
                  <Button size="sm" variant="outline" leftIcon={<Plus className="size-4" />}>
                    Thêm ghế
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <Progress
            className="mt-auto"
            value={type.totalQuantity ? (sold / type.totalQuantity) * 100 : 0}
            label={`Đã bán ${sold.toLocaleString('vi-VN')} / ${(type.totalQuantity ?? 0).toLocaleString('vi-VN')} vé`}
          />
        )}
      </CardContent>
    </Card>
  )
}

/** Sơ đồ ghế đang bán (chỉ xem): dùng API công khai, nên chỉ có khi sự kiện đã công bố. */
function PublishedSeatMap({ eventId }: { eventId: string }) {
  const event = useEvent(eventId)
  const seats = useSeats(eventId, { live: true })
  if (!event.data || !seats.data) return <Skeleton className="h-64 rounded-xl" />
  const taken = seats.data.filter((s) => s.status !== 'AVAILABLE').length
  return (
    <section aria-labelledby="seatmap-heading">
      <div className="mb-4 flex items-baseline justify-between">
        <Text id="seatmap-heading" weight="semibold" size="lg">
          Sơ đồ ghế
        </Text>
        <Text size="sm" tone="muted">
          {taken} / {seats.data.length} ghế đã giữ hoặc bán
        </Text>
      </div>
      <Card padding="lg">
        <SeatMap seats={seats.data} ticketTypes={event.data.ticketTypes} selected={[]} onToggle={() => {}} limitReached readOnly />
      </Card>
    </section>
  )
}

function DetailsTab({ detail }: { detail: OrganizerEventDetail }) {
  const venues = useVenues()
  const update = useUpdateEvent(detail.event.id)
  if (venues.isPending) return <Skeleton className="h-96 rounded-xl" />
  if (venues.isError) return <QueryError title="Không tải được địa điểm" error={venues.error} onRetry={() => venues.refetch()} />
  return (
    <Card padding="lg" className="max-w-3xl">
      <CardContent>
        <EventForm
          key={detail.event.id + detail.event.title + detail.event.startsAt}
          defaultValues={formDefaults(detail.event)}
          timeZone={detail.event.timeZone}
          venues={venues.data}
          submitLabel="Lưu thay đổi"
          submitting={update.isPending}
          error={update.error}
          onSubmit={(request) => update.mutate(request, { onSuccess: () => toast.success('Đã lưu') })}
        />
      </CardContent>
    </Card>
  )
}
