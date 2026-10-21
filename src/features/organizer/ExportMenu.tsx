import { ChevronDown, Download } from 'lucide-react'
import {
  Alert,
  Button,
  DateRangePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FormField,
  toast,
  type DateRange,
} from 'momi-ui'
import { useState } from 'react'

import { errorMessage } from '../../shared/api/problem'
import type { OrganizerEvent } from '../../shared/api/types'
import { useDownloadCsv } from './api'

/** Lịch sử soát vé mỗi lần tải tối đa chừng này ngày (BE từ chối khoảng dài hơn). */
const MAX_DAYS = 31

/** Nút "Xuất file": danh sách khách và lịch sử soát vé dạng CSV (mở được bằng Excel). */
export function ExportMenu({ event }: { event: OrganizerEvent }) {
  const download = useDownloadCsv(event.id)
  const [checkinsOpen, setCheckinsOpen] = useState(false)

  const attendees = () =>
    toast.promise(download.mutateAsync({ kind: 'attendees' }), {
      loading: 'Đang chuẩn bị danh sách khách…',
      success: 'Đã tải danh sách khách',
      error: (error: unknown) => errorMessage(error),
    })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            leftIcon={<Download className="size-4" />}
            rightIcon={<ChevronDown className="size-4" />}
            loading={download.isPending}
          >
            Xuất file
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={attendees}>Danh sách khách (CSV)</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCheckinsOpen(true)}>Lịch sử soát vé (CSV)…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CheckinExportDialog event={event} open={checkinsOpen} onOpenChange={setCheckinsOpen} />
    </>
  )
}

function CheckinExportDialog({ event, open, onOpenChange }: {
  event: OrganizerEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const download = useDownloadCsv(event.id)
  const [range, setRange] = useState<DateRange>(() => defaultRange(event))
  const days = range.from && range.to ? Math.round((+range.to - +range.from) / 86_400_000) + 1 : 0
  const tooLong = days > MAX_DAYS

  const submit = () =>
    download.mutate(
      { kind: 'checkins', from: isoDay(range.from!), to: isoDay(range.to!) },
      {
        onSuccess: () => {
          toast.success('Đã tải lịch sử soát vé')
          onOpenChange(false)
        },
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tải lịch sử soát vé</DialogTitle>
          <DialogDescription>
            Mọi lượt quét ở cổng (cả lượt bị từ chối) trong các ngày đã chọn, theo giờ của sự kiện. Tối đa{' '}
            {MAX_DAYS} ngày mỗi lần.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {download.isError && (
            <Alert tone="danger" variant="soft" role="alert">
              {errorMessage(download.error)}
            </Alert>
          )}
          <FormField label="Khoảng ngày" required error={tooLong ? `Chọn tối đa ${MAX_DAYS} ngày` : undefined}>
            <DateRangePicker value={range} onValueChange={setRange} numberOfMonths={1} clearable={false} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="ghost" tone="neutral" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!range.from || !range.to || tooLong} loading={download.isPending}>
            Tải file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Từ một ngày trước tới một ngày sau ngày diễn (ngày theo múi giờ sự kiện), như mặc định của BE. */
function defaultRange(event: OrganizerEvent): DateRange {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: event.timeZone }).format(new Date(event.startsAt))
  const [y, m, d] = day.split('-').map(Number)
  return { from: new Date(y!, m! - 1, d! - 1), to: new Date(y!, m! - 1, d! + 1) }
}

/** Ngày đã chọn trên lịch (theo lịch của trình duyệt) → YYYY-MM-DD, BE hiểu là ngày theo múi giờ sự kiện. */
function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
