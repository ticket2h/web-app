import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleSlash,
  Clock,
  CreditCard,
  Loader,
  Mail,
  MapPin,
  Ticket,
  X,
} from 'lucide-react'
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
  cn,
  Container,
  Heading,
  Separator,
  Skeleton,
  Spinner,
  Text,
} from 'momi-ui'
import { useMemo, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { EventDetail, Order, OrderItem, Seat } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { goToExternal } from '../../shared/navigation'
import { formatCountdown, formatDateTime, formatEventTime } from '../../shared/format/time'
import { useNow } from '../../shared/hooks/useNow'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PosterArt } from '../../shared/ui/PosterArt'
import { QueryError } from '../../shared/ui/QueryError'
import { OrderStatusBadge } from '../../shared/ui/status'
import { useEvent, useSeats } from '../events/api'
import { seatLabel } from '../events/checkout'
import { useCancelOrder, useOrder, useStartPayment } from './api'
import { orderSteps, parsePaymentReturn, type PaymentReturn, type StepState } from './progress'

export function OrderPage() {
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const paymentReturn = parsePaymentReturn(params.get('payment'))
  const order = useOrder(orderId, paymentReturn === 'success')

  if (order.data) {
    return <OrderView order={order.data} paymentReturn={paymentReturn} />
  }
  return (
    <Container size="md" className="py-8 md:py-12">
      <BackLink />
      <div className="mt-4">
        {order.isPending && <Skeleton className="h-96 rounded-xl" />}
        {order.isError &&
          (order.error instanceof ApiError && order.error.code === 'NOT_FOUND' ? (
            <EmptyState
              title="Không tìm thấy đơn hàng"
              description="Đơn không tồn tại hoặc không thuộc tài khoản của bạn."
            />
          ) : (
            <QueryError title="Không tải được đơn hàng" error={order.error} onRetry={() => order.refetch()} />
          ))}
      </div>
    </Container>
  )
}

function BackLink() {
  return (
    <Button asChild variant="link" tone="neutral" leftIcon={<ArrowLeft className="size-4" />} className="h-11 px-0">
      <Link to="/me/orders">Đơn hàng của tôi</Link>
    </Button>
  )
}

function OrderView({ order, paymentReturn }: { order: Order; paymentReturn: PaymentReturn }) {
  const event = useEvent(order.eventId)
  const hasSeats = order.items.some((item) => item.seatId)
  const seats = useSeats(order.eventId, { enabled: hasSeats })
  const seatsById = useMemo(() => new Map((seats.data ?? []).map((s) => [s.seatId, s])), [seats.data])

  return (
    <>
      {/* Dải đầu trang nhuốm màu son như trang sự kiện: mã đơn, tên sự kiện, trạng thái, tiến trình */}
      <section className="relative isolate overflow-hidden border-b border-primary/10 bg-primary/[0.06]">
        <div className="pattern-dots absolute inset-0 -z-10 text-primary/25" aria-hidden />
        <Container size="xl" className="pb-8 pt-4">
          <BackLink />
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <Text size="sm" weight="semibold" tone="muted">
                Mã đơn <span className="font-mono font-medium text-foreground/80">{order.orderId.slice(0, 8)}</span>
              </Text>
              <Heading as="h1" size="3xl" weight="bold" className="mt-1">
                {event.data?.title ?? 'Đơn hàng'}
              </Heading>
              {event.data && (
                <Text tone="muted" className="mt-1">
                  {formatEventTime(event.data.startsAt, event.data.timeZone)} · {event.data.venue.name}
                </Text>
              )}
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <Card padding="none" className="mt-6">
            <Stepper order={order} />
          </Card>
        </Container>
      </section>

      <Container size="xl" className="py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <StatusPanel order={order} paymentReturn={paymentReturn} />
            <OrderDetails order={order} lines={orderLines(order.items, event.data, seatsById)} />
          </div>
          <aside aria-label="Sự kiện của đơn" className="flex flex-col gap-6">
            {event.data ? <EventAside event={event.data} /> : <Skeleton className="h-80 rounded-xl" />}
            {order.status === 'PENDING_PAYMENT' && <PendingNotes />}
          </aside>
        </div>
      </Container>
    </>
  )
}

/** Chi tiết vé của đơn: mỗi loại vé một dòng, ghế của nó, tổng tiền. */
function OrderDetails({ order, lines }: { order: Order; lines: OrderLine[] }) {
  return (
      <Card padding="lg">
        <CardContent>
          <Heading as="h2" size="lg" className="mb-4">
            Chi tiết vé
          </Heading>
          <ul className="flex flex-col divide-y">
            {lines.map((line) => (
              <li key={line.ticketTypeId} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Text weight="medium">
                    {line.name} × {line.quantity}
                  </Text>
                  {line.seats.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {line.seats.map((seat, index) => (
                        // Lúc sơ đồ ghế chưa tải, mọi nhãn đều là "Ghế ngồi": key theo vị trí để không trùng
                        <Badge key={index} size="sm" variant="outline" shape="rounded">
                          {seat}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Text size="sm" tone="muted">
                      {formatVnd(line.unitPrice)} / vé
                    </Text>
                  )}
                </div>
                <span className="shrink-0 tabular-nums">{formatVnd(line.amount)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="flex items-baseline justify-between">
            <Text tone="muted">Tổng cộng</Text>
            <span className="text-2xl font-bold tabular-nums">{formatVnd(order.totalAmount)}</span>
          </div>
          {order.paidAt && (
            <Text size="sm" tone="muted" className="mt-2 text-right">
              Đã thanh toán lúc {formatDateTime(order.paidAt)}
            </Text>
          )}
        </CardContent>
      </Card>
  )
}

/** Thẻ sự kiện bên phải: poster, giờ diễn, địa điểm, link về trang sự kiện. */
function EventAside({ event }: { event: EventDetail }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <PosterArt
        variant="hero"
        seed={event.id}
        title={event.title}
        startsAt={event.startsAt}
        timeZone={event.timeZone}
        city={event.venue.city}
        className="h-64"
      />
      <CardContent className="flex flex-col gap-2.5 p-5 text-sm">
        <Text size="xs" weight="semibold" tone="muted">
          Sự kiện
        </Text>
        <p className="flex gap-2.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          {formatEventTime(event.startsAt, event.timeZone)}
        </p>
        <p className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">{event.venue.name}</span>
            <span className="block text-muted-foreground">
              {event.venue.address}, {event.venue.city}
            </span>
          </span>
        </p>
        <Button asChild variant="link" rightIcon={<ArrowRight className="size-4" />} className="h-11 self-start px-0">
          <Link to={`/events/${event.id}`}>Xem trang sự kiện</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

const NOTES = [
  { icon: <Clock />, text: 'Ghế được giữ 10 phút. Quá hạn, ghế trở lại cho người khác.' },
  { icon: <Mail />, text: 'Vé QR được gửi qua email ngay khi thanh toán xong.' },
  { icon: <X />, text: 'Bạn có thể huỷ đơn bất cứ lúc nào trước khi thanh toán.' },
]

/** Lưu ý khi đơn đang chờ thanh toán. */
function PendingNotes() {
  return (
    <Card padding="md">
      <CardContent>
        <Text weight="semibold">Lưu ý</Text>
        <ul className="mt-3 flex flex-col gap-3 text-sm">
          {NOTES.map((note) => (
            <li key={note.text} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary [&_svg]:size-4" aria-hidden>
                {note.icon}
              </span>
              <span className="pt-1">{note.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

interface OrderLine {
  ticketTypeId: string
  name: string
  quantity: number
  unitPrice: number
  amount: number
  /** Nhãn ghế với vé ngồi; rỗng với vé đứng */
  seats: string[]
}

/** Gom các dòng của đơn theo loại vé (BE trả mỗi ghế một dòng), theo thứ tự loại vé của sự kiện. */
function orderLines(items: OrderItem[], event: EventDetail | undefined, seatsById: Map<string, Seat>): OrderLine[] {
  const lines = new Map<string, OrderLine>()
  for (const item of items) {
    const line = lines.get(item.ticketTypeId) ?? {
      ticketTypeId: item.ticketTypeId,
      name: event?.ticketTypes.find((t) => t.id === item.ticketTypeId)?.name ?? 'Vé',
      quantity: 0,
      unitPrice: item.unitPrice,
      amount: 0,
      seats: [],
    }
    line.quantity += item.quantity
    line.amount += item.unitPrice * item.quantity
    if (item.seatId) {
      const seat = seatsById.get(item.seatId)
      line.seats.push(seat ? seatLabel(seat) : 'Ghế ngồi')
    }
    lines.set(item.ticketTypeId, line)
  }
  const order = new Map((event?.ticketTypes ?? []).map((t, i) => [t.id, i]))
  const natural = new Intl.Collator('vi', { numeric: true })
  return [...lines.values()]
    .map((line) => ({ ...line, seats: line.seats.sort(natural.compare) }))
    .sort((a, b) => (order.get(a.ticketTypeId) ?? 0) - (order.get(b.ticketTypeId) ?? 0))
}

const STEP_ICON: Record<StepState, ReactNode> = {
  done: <Check className="size-4" />,
  current: <Loader className="size-4" />,
  upcoming: null,
  stopped: <CircleSlash className="size-4" />,
}

function Stepper({ order }: { order: Order }) {
  const steps = orderSteps(order.status)
  return (
    <ol className="grid grid-cols-3 gap-2 p-5 sm:p-6" aria-label="Tiến trình đơn hàng">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2" aria-current={step.state === 'current' ? 'step' : undefined}>
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold',
              step.state === 'done' && 'border-success bg-success text-success-foreground',
              step.state === 'current' && 'border-primary text-primary',
              step.state === 'upcoming' && 'text-muted-foreground',
              step.state === 'stopped' && 'border-muted-foreground/40 bg-muted text-muted-foreground',
            )}
          >
            {STEP_ICON[step.state] ?? index + 1}
          </span>
          <Text
            size="sm"
            weight={step.state === 'current' ? 'semibold' : 'medium'}
            tone={step.state === 'upcoming' || step.state === 'stopped' ? 'muted' : undefined}
          >
            {step.label}
          </Text>
        </li>
      ))}
    </ol>
  )
}

function StatusPanel({ order, paymentReturn }: { order: Order; paymentReturn: PaymentReturn }) {
  switch (order.status) {
    case 'PENDING_PAYMENT':
      return <PendingPanel order={order} paymentReturn={paymentReturn} />
    case 'PAID':
      return (
        <Panel tone="info" icon={<Spinner />} title="Đã nhận tiền, đang xuất vé">
          Thường chỉ mất vài giây. Trang tự cập nhật khi vé sẵn sàng.
        </Panel>
      )
    case 'FULFILLED':
      return (
        <Panel
          tone="success"
          icon={<Ticket className="size-5" />}
          title="Vé đã sẵn sàng"
          action={
            <Button asChild>
              <Link to={`/me/tickets?order=${order.orderId}`}>Xem vé</Link>
            </Button>
          }
        >
          Vé có mã QR đã được gửi tới email của bạn. Đưa mã QR cho nhân viên soát vé ở cổng.
        </Panel>
      )
    case 'EXPIRED':
    case 'CANCELLED':
      return (
        <Panel
          tone="neutral"
          icon={<CircleSlash className="size-5" />}
          title={order.status === 'EXPIRED' ? 'Đơn đã hết hạn giữ chỗ' : 'Đơn đã huỷ'}
          action={
            <Button asChild variant="outline">
              <Link to={`/events/${order.eventId}`}>Chọn vé lại</Link>
            </Button>
          }
        >
          Ghế và vé của đơn này đã được trả lại cho người khác.
        </Panel>
      )
  }
}

function PendingPanel({ order, paymentReturn }: { order: Order; paymentReturn: PaymentReturn }) {
  const now = useNow()
  const startPayment = useStartPayment()
  const cancel = useCancelOrder()
  const remaining = order.expiresAt ? new Date(order.expiresAt).getTime() - now : null

  const pay = () =>
    startPayment.mutate(order.orderId, {
      onSuccess: (payment) => goToExternal(payment.paymentUrl),
    })

  return (
    <Card padding="lg" className="shadow-[0_16px_40px_-30px_rgb(0_0_0/0.35)]">
      <CardContent className="flex flex-col gap-5">
        {paymentReturn === 'success' && (
          <Alert tone="info" variant="soft" icon={<Spinner size="sm" />} title="Đang chờ MockPay xác nhận thanh toán">
            Kết quả về qua webhook, thường trong vài giây. Không cần thanh toán lại.
          </Alert>
        )}
        {paymentReturn === 'failed' && (
          <Alert tone="warning" variant="soft" title="Thanh toán chưa thành công">
            Bạn có thể thanh toán lại trước khi hết hạn giữ chỗ.
          </Alert>
        )}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text size="sm" tone="muted">
              Ghế được giữ cho bạn trong
            </Text>
            <div
              className={cn(
                'text-6xl font-bold tabular-nums tracking-tight',
                remaining !== null && remaining < 60_000 && 'text-destructive',
              )}
              role="timer"
              aria-live="off"
            >
              {remaining === null ? '--:--' : formatCountdown(remaining)}
            </div>
            {order.expiresAt && (
              <Text size="xs" tone="muted">
                Hết hạn lúc {formatDateTime(order.expiresAt)}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:w-64">
            <Button
              size="lg"
              leftIcon={<CreditCard className="size-4" />}
              loading={startPayment.isPending}
              onClick={pay}
            >
              Thanh toán {formatVnd(order.totalAmount)}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" tone="danger" loading={cancel.isPending}>
                  Huỷ đơn
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Huỷ đơn hàng này?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ghế và vé đang giữ sẽ trả lại cho người khác. Muốn mua lại thì phải chọn vé từ đầu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Giữ đơn</AlertDialogCancel>
                  <AlertDialogAction tone="danger" onClick={() => cancel.mutate(order.orderId)}>
                    Huỷ đơn
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {startPayment.isError && (
          <Alert tone="danger" variant="soft" role="alert">
            {paymentError(startPayment.error)}
          </Alert>
        )}
        {cancel.isError && (
          <Alert tone="danger" variant="soft" role="alert">
            {errorMessage(cancel.error)}
          </Alert>
        )}
        <Text size="xs" tone="muted">
          Bạn sẽ được chuyển sang trang thanh toán MockPay (cổng thanh toán giả lập), rồi quay lại đây.
        </Text>
      </CardContent>
    </Card>
  )
}

function paymentError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'PAYMENT_ATTEMPTS_EXCEEDED':
        return 'Đơn này đã tạo quá số lần thanh toán cho phép. Hãy huỷ đơn và đặt lại.'
      case 'ORDER_NOT_PAYABLE':
        return 'Đơn không còn thanh toán được (đã hết hạn, đã huỷ hoặc đã trả).'
      case 'PAYMENT_GATEWAY_UNAVAILABLE':
        return 'Cổng thanh toán đang không phản hồi. Thử lại sau ít phút.'
    }
  }
  return errorMessage(error)
}

const PANEL_TONES = {
  info: 'border-info/40 bg-info/5',
  success: 'border-success/40 bg-success/5',
  neutral: '',
} as const

function Panel({
  tone,
  icon,
  title,
  action,
  children,
}: {
  tone: keyof typeof PANEL_TONES
  icon: ReactNode
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card padding="lg" className={PANEL_TONES[tone]}>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-background">{icon}</span>
        <div className="flex-1">
          <Text weight="semibold">{title}</Text>
          <Text size="sm" tone="muted" className="mt-0.5">
            {children}
          </Text>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
