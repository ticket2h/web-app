import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
  Text,
  toast,
} from 'momi-ui'
import { useState, type ReactNode } from 'react'

import { errorMessage } from '../../shared/api/problem'
import type { OrganizerTicketType } from '../../shared/api/types'
import { useAddSeats } from './api'
import { gridRows, seatTotal } from './seating'

/**
 * Thêm một khối ghế hình chữ nhật cho loại vé ngồi: khu, hàng từ… tới…, ghế từ… tới…. Khối có số ghế khác nhau mỗi
 * hàng thì thêm nhiều lần (cùng tên khu).
 */
export function SeatsDialog({ eventId, ticketType, trigger }: { eventId: string; ticketType: OrganizerTicketType; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState('A')
  const [firstRow, setFirstRow] = useState('A')
  const [lastRow, setLastRow] = useState('E')
  const [seatFrom, setSeatFrom] = useState(1)
  const [seatTo, setSeatTo] = useState(12)
  const add = useAddSeats(eventId)

  const rows = gridRows(firstRow, lastRow, seatFrom, seatTo)
  const total = seatTotal(rows)
  const invalid = !section.trim() || rows.length === 0

  const submit = () =>
    add.mutate(
      { ticketTypeId: ticketType.id, section: section.trim(), rows },
      {
        onSuccess: (result) => {
          toast.success(`Đã thêm ${result.created} ghế vào khu ${section.trim()}`)
          setOpen(false)
        },
      },
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xếp ghế cho {ticketType.name}</DialogTitle>
          <DialogDescription>
            Tạo một khối ghế. Hàng là chữ cái (A–Z) hoặc số; trùng ghế đã có thì BE từ chối cả khối.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {add.isError && (
            <Alert tone="danger" variant="soft" role="alert">
              {errorMessage(add.error)}
            </Alert>
          )}
          <FormField label="Khu" required>
            <Input value={section} maxLength={50} onChange={(e) => setSection(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Từ hàng" required>
              <Input value={firstRow} maxLength={3} onChange={(e) => setFirstRow(e.target.value)} />
            </FormField>
            <FormField label="Tới hàng" required>
              <Input value={lastRow} maxLength={3} onChange={(e) => setLastRow(e.target.value)} />
            </FormField>
            <FormField label="Từ ghế số" required>
              <Input type="number" min={1} value={seatFrom} onChange={(e) => setSeatFrom(Number(e.target.value))} />
            </FormField>
            <FormField label="Tới ghế số" required>
              <Input type="number" min={1} value={seatTo} onChange={(e) => setSeatTo(Number(e.target.value))} />
            </FormField>
          </div>
          <div className="rounded-xl bg-secondary p-4">
            {rows.length > 0 ? (
              <Text size="sm">
                <span className="font-semibold">{total} ghế</span>: {rows.length} hàng ({rows[0]!.label}–
                {rows.at(-1)!.label}), mỗi hàng ghế {seatFrom}–{seatTo}.
              </Text>
            ) : (
              <Text size="sm" tone="danger">
                Kiểm tra lại hàng (cùng là chữ hoặc cùng là số, đầu ≤ cuối) và số ghế.
              </Text>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={invalid} loading={add.isPending}>
            Thêm {total > 0 ? `${total} ghế` : 'ghế'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
