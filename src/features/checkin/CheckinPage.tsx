import { Camera, CameraOff, CircleAlert, CircleCheck, CircleX, ScanLine } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Container,
  FormField,
  Input,
  Text,
  Textarea,
} from 'momi-ui'
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { CheckinResponse } from '../../shared/api/types'
import { formatDateTime } from '../../shared/format/time'
import { PageHeader } from '../../shared/ui/PageHeader'
import { useCheckin } from './api'
import { isRepeatScan, RESULT_VIEW, type ResultTone } from './result'
import { canScanQr, useQrScanner } from './useQrScanner'

interface ScanRecord {
  id: number
  at: number
  gate: string
  response: CheckinResponse | null
  /** Lỗi không phải kết quả nghiệp vụ: 403 không được phân công, mất mạng... */
  error: unknown
}

const HISTORY_SIZE = 12

export function CheckinPage() {
  const [params, setParams] = useSearchParams()
  const gate = params.get('gate') ?? ''
  const [cameraOn, setCameraOn] = useState(false)
  const [manual, setManual] = useState('')
  const [history, setHistory] = useState<ScanRecord[]>([])
  const lastScan = useRef<{ token: string; at: number } | null>(null)
  const nextId = useRef(1)
  const checkin = useCheckin()

  const submit = useCallback(
    (raw: string) => {
      const qrToken = raw.trim()
      const now = Date.now()
      if (!qrToken || !gate.trim() || checkin.isPending || isRepeatScan(lastScan.current, qrToken, now)) return
      lastScan.current = { token: qrToken, at: now }
      const record = (response: CheckinResponse | null, error: unknown) =>
        setHistory((items) => [{ id: nextId.current++, at: Date.now(), gate, response, error }, ...items].slice(0, HISTORY_SIZE))
      checkin.mutate(
        { qrToken, gate: gate.trim() },
        {
          onSuccess: (response) => record(response, null),
          onError: (error) => record(null, error),
        },
      )
    },
    [checkin, gate],
  )

  const scanner = useQrScanner(cameraOn && gate.trim() !== '', submit)
  const scanSupported = canScanQr()

  const onManualSubmit = (event: FormEvent) => {
    event.preventDefault()
    lastScan.current = null // nhập tay: người soát chủ động bấm, luôn gửi
    submit(manual)
    setManual('')
  }

  const latest = history[0]

  return (
    <Container size="xl" className="py-10">
      <PageHeader
        eyebrow="Nhân viên soát vé"
        title="Soát vé"
        description="Quét mã QR trên vé của khách. Mỗi vé chỉ vào cổng được một lần."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-5">
          <FormField label="Cổng" required description="Ghi vào lịch sử vé, ví dụ A1, B2.">
            <Input
              value={gate}
              maxLength={50}
              placeholder="A1"
              onChange={(event) => setParams(event.target.value ? { gate: event.target.value } : {}, { replace: true })}
            />
          </FormField>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-poster-ink text-poster-paper">
            {cameraOn && scanSupported ? (
              <>
                <video ref={scanner.videoRef} className="size-full object-cover" muted playsInline />
                <ScanFrame />
              </>
            ) : (
              <div className="grid size-full place-items-center p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <ScanLine className="size-10 opacity-60" aria-hidden />
                  <Text size="sm" className="max-w-xs opacity-80">
                    {scanSupported
                      ? 'Bật camera rồi đưa mã QR vào khung. Kết quả hiện ngay bên cạnh.'
                      : 'Trình duyệt này không tự đọc được QR bằng camera. Dán hoặc gõ mã vào ô bên dưới.'}
                  </Text>
                </div>
              </div>
            )}
          </div>
          {scanSupported && (
            <Button
              variant={cameraOn ? 'outline' : 'solid'}
              leftIcon={cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
              disabled={!gate.trim()}
              onClick={() => setCameraOn((on) => !on)}
            >
              {cameraOn ? 'Tắt camera' : gate.trim() ? 'Bật camera' : 'Nhập cổng để bật camera'}
            </Button>
          )}
          {scanner.error && (
            <Alert tone="danger" variant="soft">
              {scanner.error}
            </Alert>
          )}

          <form onSubmit={onManualSubmit} className="flex flex-col gap-3">
            <FormField label="Nhập mã bằng tay" description="Chuỗi đọc được từ mã QR (bắt đầu bằng TR1.).">
              <Textarea
                rows={2}
                value={manual}
                spellCheck={false}
                className="font-mono text-xs"
                onChange={(event) => setManual(event.target.value)}
              />
            </FormField>
            <Button type="submit" variant="outline" loading={checkin.isPending} disabled={!manual.trim() || !gate.trim()}>
              Kiểm tra mã
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div aria-live="assertive">{latest ? <ResultPanel record={latest} /> : <IdlePanel />}</div>

          {history.length > 1 && (
            <section aria-labelledby="history-heading">
              <Text id="history-heading" size="sm" weight="semibold" className="mb-3">
                Lượt quét trước
              </Text>
              <ul className="flex flex-col divide-y rounded-xl border bg-card">
                {history.slice(1).map((record) => (
                  <HistoryRow key={record.id} record={record} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Container>
  )
}

/** Khung ngắm bốn góc trên hình camera. */
function ScanFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      <div className="relative size-3/5 max-h-64 max-w-64">
        <span className="absolute left-0 top-0 size-8 rounded-tl-xl border-l-4 border-t-4 border-poster-paper" />
        <span className="absolute right-0 top-0 size-8 rounded-tr-xl border-r-4 border-t-4 border-poster-paper" />
        <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-4 border-l-4 border-poster-paper" />
        <span className="absolute bottom-0 right-0 size-8 rounded-br-xl border-b-4 border-r-4 border-poster-paper" />
      </div>
    </div>
  )
}

const TONE_STYLES: Record<ResultTone, { panel: string; icon: ReactNode }> = {
  success: { panel: 'bg-success text-success-foreground', icon: <CircleCheck className="size-14" aria-hidden /> },
  warning: { panel: 'bg-warning text-warning-foreground', icon: <CircleAlert className="size-14" aria-hidden /> },
  danger: { panel: 'bg-destructive text-destructive-foreground', icon: <CircleX className="size-14" aria-hidden /> },
}

function describe(record: ScanRecord): { title: string; tone: ResultTone; detail: string } {
  if (record.response) {
    const view = RESULT_VIEW[record.response.result]
    return { ...view, detail: record.response.message }
  }
  if (record.error instanceof ApiError && record.error.code === 'FORBIDDEN') {
    return { ...RESULT_VIEW.FORBIDDEN, detail: 'Bạn không được phân công soát vé cho sự kiện của vé này.' }
  }
  return { title: 'Không kiểm tra được', tone: 'danger', detail: errorMessage(record.error) }
}

function ResultPanel({ record }: { record: ScanRecord }) {
  const { title, tone, detail } = describe(record)
  const ticket = record.response?.ticket
  return (
    <Card padding="none" className={cn('overflow-hidden border-0', TONE_STYLES[tone].panel)} data-testid="checkin-result">
      <CardContent className="flex flex-col gap-6 p-8">
        <div className="flex items-center gap-5">
          {TONE_STYLES[tone].icon}
          <div>
            <div className="font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">{title}</div>
            <Text className="mt-2 opacity-90">{detail}</Text>
          </div>
        </div>
        {ticket && (
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-black/10 p-4">
            <div>
              <Text size="xs" className="uppercase tracking-[0.14em] opacity-75">
                Loại vé
              </Text>
              <Text weight="semibold">{ticket.ticketType}</Text>
            </div>
            <div>
              <Text size="xs" className="uppercase tracking-[0.14em] opacity-75">
                Chỗ
              </Text>
              <Text weight="semibold" className="font-display text-2xl">
                {ticket.seat ?? 'Vé đứng'}
              </Text>
            </div>
            {record.response?.checkedInAt && record.response.result !== 'OK' && (
              <div className="col-span-2">
                <Text size="sm">
                  Đã vào lúc {formatDateTime(record.response.checkedInAt)}
                  {record.response.checkedInGate && ` tại cổng ${record.response.checkedInGate}`}
                </Text>
              </div>
            )}
          </div>
        )}
        <Text size="xs" className="opacity-75">
          Cổng {record.gate} · {new Date(record.at).toLocaleTimeString('vi-VN')}
        </Text>
      </CardContent>
    </Card>
  )
}

function IdlePanel() {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed p-8 text-center">
      <div>
        <ScanLine className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <Text weight="semibold" className="mt-3">
          Chờ quét vé
        </Text>
        <Text size="sm" tone="muted">
          Kết quả từng lượt quét hiện ở đây.
        </Text>
      </div>
    </div>
  )
}

const BADGE_TONES: Record<ResultTone, 'success' | 'warning' | 'danger'> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
}

function HistoryRow({ record }: { record: ScanRecord }) {
  const { title, tone } = describe(record)
  const ticket = record.response?.ticket
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="min-w-0">
        <Badge tone={BADGE_TONES[tone]} dot size="sm">
          {title}
        </Badge>
        {ticket && (
          <Text size="sm" tone="muted" className="mt-1 truncate">
            {ticket.ticketType} · {ticket.seat ?? 'Vé đứng'}
          </Text>
        )}
      </div>
      <Text size="xs" tone="muted" className="shrink-0 tabular-nums">
        {record.gate} · {new Date(record.at).toLocaleTimeString('vi-VN')}
      </Text>
    </li>
  )
}
