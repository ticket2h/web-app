import { CalendarDays, Clock, MapPin, SearchX, Ticket, Users } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  Heading,
  Separator,
  Skeleton,
  Text,
} from 'momi-ui'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { EventDetail, Seat, TicketTypeView } from '../../shared/api/types'
import { useSession } from '../../shared/auth/useAuth'
import { formatVnd } from '../../shared/format/money'
import { formatEventTime } from '../../shared/format/time'
import { useNow } from '../../shared/hooks/useNow'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PosterArt } from '../../shared/ui/PosterArt'
import { QueryError } from '../../shared/ui/QueryError'
import { useCreateOrder, useEvent, useSeats } from './api'
import {
  buildOrderRequest,
  EMPTY_SELECTION,
  selectedCount,
  selectionKey,
  summarize,
  withoutSeats,
  type Selection,
} from './checkout'
import { saleStatus, type SaleStatus } from './format'
import { QuantityStepper } from './QuantityStepper'
import { SeatMap } from './SeatMap'

export function EventDetailPage() {
  const { eventId } = useParams()
  const event = useEvent(eventId)

  if (event.isPending) {
    return <EventDetailSkeleton />
  }
  if (event.isError) {
    return (
      <Container size="md" className="py-16">
        {event.error instanceof ApiError && event.error.code === 'NOT_FOUND' ? (
          <EmptyState
            icon={<SearchX />}
            title="Không tìm thấy sự kiện"
            description="Sự kiện không tồn tại hoặc chưa được công bố."
            action={
              <Button asChild variant="outline">
                <Link to="/">Xem sự kiện khác</Link>
              </Button>
            }
          />
        ) : (
          <QueryError title="Không tải được sự kiện" error={event.error} onRetry={() => event.refetch()} />
        )}
      </Container>
    )
  }
  return <EventView event={event.data} />
}

function EventView({ event }: { event: EventDetail }) {
  const now = useNow(30_000)
  const sale = saleStatus(event, new Date(now))
  const hasSeated = event.ticketTypes.some((t) => t.kind === 'SEATED')
  const seats = useSeats(event.id, { enabled: hasSeated, live: sale.kind === 'onSale' })
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION)

  const seatsById = useMemo(() => new Map((seats.data ?? []).map((s) => [s.seatId, s])), [seats.data])
  const count = selectedCount(selection)
  const limitReached = count >= event.maxTicketsPerUser
  const canSelect = sale.kind === 'onSale'
  const minPrice = Math.min(...event.ticketTypes.map((t) => t.price))

  const toggleSeat = (seat: Seat) =>
    setSelection((current) => ({
      ...current,
      seatIds: current.seatIds.includes(seat.seatId)
        ? current.seatIds.filter((id) => id !== seat.seatId)
        : [...current.seatIds, seat.seatId],
    }))

  const setGa = (type: TicketTypeView, quantity: number) =>
    setSelection((current) => ({ ...current, ga: { ...current.ga, [type.id]: quantity } }))

  return (
    <div className="pb-28 lg:pb-12">
      <Container size="xl" className="pt-8 md:pt-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
          <PosterArt
            seed={event.id}
            title={event.title}
            startsAt={event.startsAt}
            timeZone={event.timeZone}
            city={event.venue.city}
            variant="hero"
            className="aspect-[4/5] rounded-2xl shadow-[0_30px_60px_-30px] shadow-foreground/40"
          />
          <div className="flex flex-col justify-center">
            <SaleLine sale={sale} timeZone={event.timeZone} />
            <Heading as="h1" weight="bold" className="mt-3 text-4xl leading-[1.05] md:text-5xl">
              {event.title}
            </Heading>
            <dl className="mt-8 grid gap-4 text-sm">
              <InfoRow icon={<CalendarDays />} label="Thời gian">
                {formatEventTime(event.startsAt, event.timeZone)}
              </InfoRow>
              <InfoRow icon={<MapPin />} label="Địa điểm">
                <span className="font-medium">{event.venue.name}</span>
                <span className="block text-muted-foreground">
                  {event.venue.address}, {event.venue.city}
                </span>
              </InfoRow>
              <InfoRow icon={<Ticket />} label="Giá vé">
                Từ <span className="font-semibold">{formatVnd(minPrice)}</span>
              </InfoRow>
              <InfoRow icon={<Users />} label="Giới hạn">
                Tối đa {event.maxTicketsPerUser} vé mỗi tài khoản
              </InfoRow>
            </dl>
            {event.description && (
              <Text className="mt-8 max-w-prose whitespace-pre-line leading-relaxed text-foreground/85">
                {event.description}
              </Text>
            )}
          </div>
        </div>
      </Container>

      <Container size="xl" className="mt-14">
        <Separator className="mb-10" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-10">
            {hasSeated && (
              <section aria-labelledby="seat-heading">
                <Heading as="h2" id="seat-heading" size="xl" className="mb-1">
                  Chọn ghế
                </Heading>
                <Text size="sm" tone="muted" className="mb-6">
                  Bấm vào ghế trống để chọn, bấm lần nữa để bỏ. Sơ đồ tự cập nhật khi có người khác giữ ghế.
                </Text>
                {seats.isPending && <Skeleton className="h-72 rounded-xl" />}
                {seats.isError && (
                  <QueryError title="Không tải được sơ đồ ghế" error={seats.error} onRetry={() => seats.refetch()} />
                )}
                {seats.data && (
                  <Card padding="lg" className="bg-card/60">
                    <SeatMap
                      seats={seats.data}
                      ticketTypes={event.ticketTypes}
                      selected={selection.seatIds}
                      onToggle={toggleSeat}
                      limitReached={limitReached}
                      disabled={!canSelect}
                    />
                  </Card>
                )}
              </section>
            )}

            {event.ticketTypes.some((t) => t.kind === 'GA') && (
              <section aria-labelledby="ga-heading">
                <Heading as="h2" id="ga-heading" size="xl" className="mb-1">
                  {hasSeated ? 'Vé đứng' : 'Chọn vé'}
                </Heading>
                <Text size="sm" tone="muted" className="mb-6">
                  Vé không ghế, vào cửa theo khu vực.
                </Text>
                <div className="flex flex-col divide-y rounded-xl border bg-card">
                  {event.ticketTypes
                    .filter((t) => t.kind === 'GA')
                    .map((type) => {
                      const quantity = selection.ga[type.id] ?? 0
                      const room = event.maxTicketsPerUser - count + quantity
                      return (
                        <div key={type.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                          <div className="min-w-0">
                            <Text weight="semibold">{type.name}</Text>
                            <Text size="sm" tone="muted">
                              {formatVnd(type.price)} ·{' '}
                              {type.available > 0 ? `còn ${type.available.toLocaleString('vi-VN')} vé` : 'đã hết vé'}
                            </Text>
                          </div>
                          <QuantityStepper
                            label={type.name}
                            value={quantity}
                            max={Math.min(room, type.available)}
                            onChange={(value) => setGa(type, value)}
                            disabled={!canSelect || type.available === 0}
                          />
                        </div>
                      )
                    })}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary
              event={event}
              sale={sale}
              selection={selection}
              seatsById={seatsById}
              onSelectionChange={setSelection}
              onSeatsChanged={() => seats.refetch()}
            />
          </aside>
        </div>
      </Container>
    </div>
  )
}

interface OrderSummaryProps {
  event: EventDetail
  sale: SaleStatus
  selection: Selection
  seatsById: Map<string, Seat>
  onSelectionChange: (selection: Selection) => void
  onSeatsChanged: () => void
}

function OrderSummary({ event, sale, selection, seatsById, onSelectionChange, onSeatsChanged }: OrderSummaryProps) {
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  // Cùng lựa chọn thì giữ Idempotency-Key cũ: bấm lại sau lỗi mạng không giữ thêm ghế
  const [attempt, setAttempt] = useState<{ key: string; idempotencyKey: string } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { lines, total, count } = summarize(selection, event.ticketTypes, seatsById)
  const isCustomer = session?.user.role === 'CUSTOMER'

  const submit = () => {
    setNotice(null)
    const key = selectionKey(selection)
    const idempotencyKey = attempt?.key === key ? attempt.idempotencyKey : crypto.randomUUID()
    setAttempt({ key, idempotencyKey })
    createOrder.mutate(
      { body: buildOrderRequest(event.id, selection, seatsById), idempotencyKey },
      {
        onSuccess: (order) => navigate(`/orders/${order.orderId}`),
        onError: (error) => {
          if (!(error instanceof ApiError)) return
          if (error.code === 'SEAT_UNAVAILABLE') {
            const taken = (error.problem.unavailableSeatIds as string[] | undefined) ?? []
            onSelectionChange(withoutSeats(selection, taken))
            onSeatsChanged()
            setNotice('Một số ghế vừa có người giữ nên đã được bỏ khỏi lựa chọn. Chọn ghế khác rồi đặt lại.')
          }
          if (error.status === 401) {
            navigate(`/login?next=${encodeURIComponent(location.pathname)}`)
          }
        },
      },
    )
  }

  const blockedReason =
    sale.kind === 'upcoming'
      ? `Mở bán lúc ${formatEventTime(sale.opensAt.toISOString(), event.timeZone)}`
      : sale.kind === 'closed'
        ? 'Sự kiện đã đóng bán'
        : session && !isCustomer
          ? 'Chỉ tài khoản khách hàng mới đặt được vé'
          : null

  const action = !session ? (
    <Button asChild fullWidth size="lg">
      <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Đăng nhập để đặt vé</Link>
    </Button>
  ) : (
    <Button
      fullWidth
      size="lg"
      onClick={submit}
      loading={createOrder.isPending}
      disabled={count === 0 || blockedReason !== null}
    >
      {count === 0 ? 'Chọn vé để tiếp tục' : `Giữ chỗ ${count} vé`}
    </Button>
  )

  return (
    <>
      <Card padding="lg" className="border-foreground/15">
        <CardHeader>
          <CardTitle className="font-display text-xl">Vé đã chọn</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {lines.length === 0 ? (
            <Text size="sm" tone="muted">
              Chưa chọn vé nào. Mỗi tài khoản đặt tối đa {event.maxTicketsPerUser} vé cho sự kiện này.
            </Text>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li key={line.ticketType.id} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {line.ticketType.name} × {line.quantity}
                    </span>
                    <span className="tabular-nums">{formatVnd(line.amount)}</span>
                  </div>
                  {line.seats.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {line.seats.map((seat) => (
                        <Badge key={seat} size="sm" variant="outline" shape="rounded">
                          {seat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Separator />
          <div className="flex items-baseline justify-between">
            <Text size="sm" tone="muted">
              Tổng cộng
            </Text>
            <span className="font-display text-2xl font-bold tabular-nums">{formatVnd(total)}</span>
          </div>
          {notice && (
            <Alert tone="warning" variant="soft">
              {notice}
            </Alert>
          )}
          {createOrder.isError && !(createOrder.error instanceof ApiError && createOrder.error.code === 'SEAT_UNAVAILABLE') && (
            <Alert tone="danger" variant="soft" role="alert">
              {errorMessage(createOrder.error)}
            </Alert>
          )}
          {blockedReason && (
            <Text size="sm" tone="muted" className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" aria-hidden /> {blockedReason}
            </Text>
          )}
          <div className="hidden lg:block">{action}</div>
          <Text size="xs" tone="muted">
            Ghế được giữ 10 phút để bạn thanh toán. Quá hạn, ghế trở lại cho người khác.
          </Text>
        </CardContent>
      </Card>

      {/* Màn hình nhỏ: thanh đặt vé luôn ở đáy */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="shrink-0">
            <Text size="xs" tone="muted">
              {count} vé
            </Text>
            <div className="font-display text-lg font-bold tabular-nums">{formatVnd(total)}</div>
          </div>
          <div className="flex-1">{action}</div>
        </div>
      </div>
    </>
  )
}

function SaleLine({ sale, timeZone }: { sale: SaleStatus; timeZone: string }) {
  switch (sale.kind) {
    case 'onSale':
      return (
        <Badge tone="success" dot className="self-start">
          Đang mở bán · đóng lúc {formatEventTime(sale.closesAt.toISOString(), timeZone)}
        </Badge>
      )
    case 'upcoming':
      return (
        <Badge tone="info" className="self-start">
          Mở bán {formatEventTime(sale.opensAt.toISOString(), timeZone)}
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

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr] items-start gap-3">
      <span className="grid size-9 place-items-center rounded-lg bg-secondary text-foreground/80 [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  )
}

function EventDetailSkeleton() {
  return (
    <Container size="xl" className="py-12">
      <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <div className="flex flex-col gap-4 pt-10">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-3/4" />
        </div>
      </div>
    </Container>
  )
}
