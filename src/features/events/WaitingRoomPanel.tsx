import type { UseQueryResult } from '@tanstack/react-query'
import { Hourglass, PartyPopper } from 'lucide-react'
import { Alert, Button, Card, Heading, Progress, Skeleton, Text } from 'momi-ui'
import { useRef } from 'react'
import { Link } from 'react-router'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { QueueStatus } from '../../shared/api/types'
import { formatCountdown } from '../../shared/format/time'
import { useNow } from '../../shared/hooks/useNow'
import { formatWait } from './waitingRoom'

interface WaitingRoomPanelProps {
  /** `null`: chưa đăng nhập (chưa xếp hàng được). */
  status: UseQueryResult<QueueStatus> | null
  loginPath: string
}

/**
 * Phòng chờ lúc mở bán (ADR-027 của core-service): thứ tự của mình giảm dần, đến lượt thì có 10 phút để chọn ghế và
 * đặt vé. Trang tự hỏi lại thứ tự (càng gần lượt càng hỏi dày), không cần tải lại.
 */
export function WaitingRoomPanel({ status, loginPath }: WaitingRoomPanelProps) {
  if (!status) {
    return (
      <Card padding="lg" className="border-primary/30 bg-primary/5" data-slot="waiting-room">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading as="h2" size="lg">
              Sự kiện có phòng chờ
            </Heading>
            <Text size="sm" tone="muted" className="mt-1 max-w-prose">
              Lúc mở bán, mọi người xếp hàng và lần lượt được vào chọn ghế. Đăng nhập để vào hàng.
            </Text>
          </div>
          <Button asChild>
            <Link to={loginPath}>Đăng nhập để xếp hàng</Link>
          </Button>
        </div>
      </Card>
    )
  }
  if (status.isPending) {
    return <Skeleton className="h-36 rounded-xl" />
  }
  if (status.isError) {
    const code = status.error instanceof ApiError ? status.error.code : undefined
    return (
      <Alert tone={code === 'WAITING_ROOM_NOT_OPEN' ? 'info' : 'warning'} variant="soft" role="status">
        {code === 'WAITING_ROOM_UNAVAILABLE'
          ? 'Phòng chờ tạm thời gián đoạn, trang đang thử lại. Chỗ của bạn vẫn được giữ.'
          : errorMessage(status.error)}
      </Alert>
    )
  }
  const queue = status.data
  if (queue.state === 'ADMITTED') {
    return <Admitted expiresAt={queue.admissionExpiresAt} />
  }
  if (queue.state === 'WAITING') {
    return <Waiting queue={queue} />
  }
  if (queue.state === 'NOT_IN_QUEUE') {
    return (
      <Alert tone="info" variant="soft" role="status">
        Đang xếp bạn vào hàng…
      </Alert>
    )
  }
  return null
}

function Waiting({ queue }: { queue: QueueStatus }) {
  const position = queue.position ?? 0
  // Thứ tự lúc mới vào hàng: thanh tiến độ đi từ đó về 0
  const first = useRef(position)
  first.current = Math.max(first.current, position)
  const progress = first.current > 1 ? Math.round(((first.current - position) / (first.current - 1)) * 100) : 100

  return (
    <Card padding="lg" className="border-primary/30 bg-primary/5" data-slot="waiting-room" aria-live="polite">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary" aria-hidden>
          <Hourglass className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Text size="sm" tone="muted">
            Bạn đang ở vị trí
          </Text>
          <div className="font-display text-4xl font-bold tabular-nums">{position.toLocaleString('vi-VN')}</div>
          <Text size="sm" className="mt-1">
            {position <= 1 ? 'Bạn là người kế tiếp' : `Trước bạn còn ${(position - 1).toLocaleString('vi-VN')} người`}
            {queue.estimatedWaitSeconds !== null && ` · chờ ${formatWait(queue.estimatedWaitSeconds)}`}
          </Text>
          <Progress value={progress} size="sm" className="mt-4" aria-label="Tiến độ trong hàng chờ" />
          <Text size="xs" tone="muted" className="mt-3">
            {queue.waiting !== null && `${queue.waiting.toLocaleString('vi-VN')} người đang chờ. `}
            Giữ trang này mở: rời trang quá một phút sẽ mất chỗ.
          </Text>
        </div>
      </div>
    </Card>
  )
}

function Admitted({ expiresAt }: { expiresAt: string | null }) {
  const now = useNow(1000)
  const left = expiresAt ? Date.parse(expiresAt) - now : 0
  return (
    <Alert tone="success" variant="soft" icon={<PartyPopper />} role="status">
      <span className="font-semibold">Đến lượt bạn!</span> Chọn ghế và đặt vé trong{' '}
      <span className="font-mono tabular-nums">{formatCountdown(left)}</span>, quá thời gian sẽ phải xếp hàng lại.
    </Alert>
  )
}
