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
import type { OrganizerVenue } from '../../shared/api/types'
import { useCreateVenue } from './api'

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên địa điểm').max(200, 'Tối đa 200 ký tự'),
  address: z.string().trim().min(1, 'Nhập địa chỉ').max(500, 'Tối đa 500 ký tự'),
  city: z.string().trim().min(1, 'Nhập thành phố').max(100, 'Tối đa 100 ký tự'),
})

type Values = z.infer<typeof schema>

/** Thêm địa điểm tổ chức. `trigger` là nút mở hộp thoại. */
export function VenueDialog({ trigger, onCreated }: { trigger: ReactNode; onCreated?: (venue: OrganizerVenue) => void }) {
  const [open, setOpen] = useState(false)
  const create = useCreateVenue()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', address: '', city: '' } })

  const onSubmit = handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: (venue) => {
        toast.success(`Đã thêm ${venue.name}`)
        reset()
        setOpen(false)
        onCreated?.(venue)
      },
    }),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Thêm địa điểm</DialogTitle>
            <DialogDescription>Nơi diễn ra sự kiện. Tên và thành phố giúp khán giả tìm thấy sự kiện.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {create.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {errorMessage(create.error)}
              </Alert>
            )}
            <FormField label="Tên địa điểm" error={errors.name?.message} required>
              <Input placeholder="Sân vận động Mỹ Đình" autoFocus {...register('name')} />
            </FormField>
            <FormField label="Địa chỉ" error={errors.address?.message} required>
              <Input placeholder="Lê Đức Thọ, Nam Từ Liêm" {...register('address')} />
            </FormField>
            <FormField label="Thành phố" error={errors.city?.message} required>
              <Input placeholder="Hà Nội" {...register('city')} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={create.isPending}>
              Thêm địa điểm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
