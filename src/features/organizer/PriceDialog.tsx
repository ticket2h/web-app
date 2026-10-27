import { zodResolver } from '@hookform/resolvers/zod'
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
  toast,
} from 'momi-ui'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { errorMessage } from '../../shared/api/problem'
import type { OrganizerTicketType } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { useChangePrice } from './api'

const schema = z.object({
  price: z.number({ message: 'Nhập giá vé' }).min(0, 'Giá không âm').max(999_999_999_999, 'Giá quá lớn'),
})

type Values = z.infer<typeof schema>

/** Đổi giá một loại vé. Đơn đã tạo giữ giá lúc mua; thay đổi được ghi vào lịch sử thao tác. */
export function PriceDialog({ eventId, type, trigger }: { eventId: string; type: OrganizerTicketType; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const change = useChangePrice(eventId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { price: type.price } })

  const onSubmit = handleSubmit((values) =>
    change.mutate(
      { ticketTypeId: type.id, price: values.price },
      {
        onSuccess: (updated) => {
          toast.success(`${updated.name}: ${formatVnd(updated.price)}`)
          setOpen(false)
        },
      },
    ),
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) reset({ price: type.price })
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Đổi giá {type.name}</DialogTitle>
            <DialogDescription>
              Giá mới áp dụng cho đơn đặt sau khi lưu; đơn đã đặt giữ giá lúc mua. Thay đổi được ghi vào lịch sử thao
              tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {change.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {errorMessage(change.error)}
              </Alert>
            )}
            <FormField
              label="Giá mới (đồng)"
              description={`Giá hiện tại: ${formatVnd(type.price)}`}
              error={errors.price?.message}
              required
            >
              <Input type="number" min={0} step={1000} autoFocus {...register('price', { valueAsNumber: true })} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={change.isPending}>
              Lưu giá mới
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
