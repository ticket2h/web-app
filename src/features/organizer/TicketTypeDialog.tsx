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
  RadioGroup,
  RadioGroupItem,
  toast,
} from 'momi-ui'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { errorMessage } from '../../shared/api/problem'
import { useAddTicketType } from './api'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên loại vé').max(100, 'Tối đa 100 ký tự'),
    kind: z.enum(['SEATED', 'GA']),
    price: z.number({ message: 'Nhập giá vé' }).min(0, 'Giá không âm').max(999_999_999_999, 'Giá quá lớn'),
    quantity: z.number().int().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'GA' && !(values.quantity && values.quantity >= 1 && values.quantity <= 1_000_000)) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Từ 1 đến 1.000.000 vé' })
    }
  })

type Values = z.infer<typeof schema>

export function TicketTypeDialog({ eventId, trigger }: { eventId: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const add = useAddTicketType(eventId)
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', kind: 'SEATED', price: 0 } })
  const kind = watch('kind')

  const onSubmit = handleSubmit((values) =>
    add.mutate(
      { name: values.name, kind: values.kind, price: values.price, quantity: values.kind === 'GA' ? values.quantity : undefined },
      {
        onSuccess: (type) => {
          toast.success(`Đã thêm loại vé ${type.name}`)
          reset()
          setOpen(false)
        },
      },
    ),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Thêm loại vé</DialogTitle>
            <DialogDescription>Vé ngồi cần xếp ghế sau khi tạo. Vé đứng (GA) chỉ cần số lượng.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {add.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {errorMessage(add.error)}
              </Alert>
            )}
            <FormField label="Tên loại vé" error={errors.name?.message} required>
              <Input placeholder="VIP, Phổ thông, Khu A…" autoFocus {...register('name')} />
            </FormField>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <FormField label="Kiểu vé" required>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-2">
                    <RadioGroupItem value="SEATED" label="Vé ngồi" description="Khách chọn ghế trên sơ đồ" />
                    <RadioGroupItem value="GA" label="Vé đứng (GA)" description="Không số ghế, giới hạn số lượng" />
                  </RadioGroup>
                </FormField>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Giá (đồng)" error={errors.price?.message} required>
                <Input type="number" min={0} step={1000} {...register('price', { valueAsNumber: true })} />
              </FormField>
              {kind === 'GA' && (
                <FormField label="Số lượng vé" error={errors.quantity?.message} required>
                  <Input type="number" min={1} {...register('quantity', { valueAsNumber: true })} />
                </FormField>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={add.isPending}>
              Thêm loại vé
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
