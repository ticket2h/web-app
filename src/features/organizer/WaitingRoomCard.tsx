import { Hourglass } from 'lucide-react'
import { Alert, Button, Card, CardContent, FormField, NumberField, Switch, Text, toast } from 'momi-ui'
import { useState } from 'react'

import { errorMessage } from '../../shared/api/problem'
import type { OrganizerEvent } from '../../shared/api/types'
import { useSetWaitingRoom, useWaitingRoomStats } from './api'

/** Mặc định khi bật: load test M5 (ADR-029 ở infra) đo được hai instance core chịu 100 người mỗi giây, p95 dưới 20 ms. */
const DEFAULT_ADMIT_PER_SECOND = 100
const MAX_ADMIT_PER_SECOND = 10_000

/**
 * Phòng chờ của sự kiện (M5, ADR-027 của core-service). Bật thì lúc mở bán khách xếp hàng, mỗi giây chỉ
 * `admitPerSecond` người được vào chọn ghế: database chỉ chịu chừng ấy người đặt vé, dù bao nhiêu người mở trang.
 */
export function WaitingRoomCard({ event }: { event: OrganizerEvent }) {
  const current = event.waitingRoomAdmitPerSecond
  const [enabled, setEnabled] = useState(current !== null)
  const [rate, setRate] = useState(current ?? DEFAULT_ADMIT_PER_SECOND)
  const save = useSetWaitingRoom(event.id)
  const stats = useWaitingRoomStats(event.id, current !== null && event.status === 'PUBLISHED')
  const wanted = enabled ? rate : null
  const dirty = wanted !== current

  const submit = () =>
    save.mutate(wanted, {
      onSuccess: (updated) =>
        toast.success(
          updated.waitingRoomAdmitPerSecond === null
            ? 'Đã tắt phòng chờ'
            : `Phòng chờ: ${updated.waitingRoomAdmitPerSecond.toLocaleString('vi-VN')} người vào mỗi giây`,
        ),
    })

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary" aria-hidden>
            <Hourglass className="size-4" />
          </span>
          <div>
            <Text weight="semibold">Phòng chờ lúc mở bán</Text>
            <Text size="sm" tone="muted" className="max-w-prose">
              Khách xếp hàng từ 30 phút trước giờ mở bán (đến trước giờ mở bán được xếp ngẫu nhiên), mỗi giây một
              nhóm được vào và có 10 phút để đặt vé. Đổi được cả khi đang bán.
            </Text>
          </div>
        </div>
        {save.isError && (
          <Alert tone="danger" variant="soft" role="alert">
            {errorMessage(save.error)}
          </Alert>
        )}
        <div className="flex flex-wrap items-end gap-6">
          <Switch checked={enabled} onCheckedChange={setEnabled} label="Bật phòng chờ" />
          {enabled && (
            <FormField label="Số người vào mỗi giây" className="w-48">
              <NumberField value={rate} onValueChange={setRate} min={1} max={MAX_ADMIT_PER_SECOND} step={10} />
            </FormField>
          )}
          <Button onClick={submit} loading={save.isPending} disabled={!dirty}>
            Lưu
          </Button>
        </div>
        {stats.data && stats.data.admitPerSecond !== null && (
          <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm sm:max-w-sm">
            <div>
              <dt className="text-muted-foreground">Đang chờ</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">
                {stats.data.waiting.toLocaleString('vi-VN')}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Đã vào, đang đặt vé</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">
                {stats.data.admitted.toLocaleString('vi-VN')}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
