import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, DateTimePicker, FormField, Input, NativeSelect, Text, Textarea } from 'momi-ui'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { errorMessage } from '../../shared/api/problem'
import type { EventRequest, OrganizerVenue } from '../../shared/api/types'
import { eventFormSchema, toEventRequest, type EventFormValues } from './eventForm'

interface EventFormProps {
  defaultValues: EventFormValues
  timeZone: string
  venues: OrganizerVenue[]
  submitLabel: string
  submitting: boolean
  error: unknown
  onSubmit: (request: EventRequest) => void
}

const TIME_SUGGESTIONS = ['09:00', '10:00', '18:00', '19:00', '19:30', '20:00']

/** Thông tin sự kiện. Giờ nhập theo múi giờ của sự kiện (giờ tại nơi diễn), không theo máy người nhập. */
export function EventForm({ defaultValues, timeZone, venues, submitLabel, submitting, error, onSubmit }: EventFormProps) {
  const schema = useMemo(() => eventFormSchema(timeZone), [timeZone])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EventFormValues>({ resolver: zodResolver(schema), defaultValues })

  const submit = handleSubmit((values) => onSubmit(toEventRequest(values, timeZone)))

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {error !== null && error !== undefined && (
        <Alert tone="danger" variant="soft" role="alert">
          {errorMessage(error)}
        </Alert>
      )}
      <FormField label="Tên sự kiện" error={errors.title?.message} required>
        <Input placeholder="Sơn Tùng M-TP Live Concert 2026" {...register('title')} />
      </FormField>
      <FormField label="Địa điểm" error={errors.venueId?.message} required>
        <NativeSelect placeholder="Chọn địa điểm" {...register('venueId')}>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} · {venue.city}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Giới thiệu" error={errors.description?.message} description="Hiện trên trang sự kiện. Xuống dòng được.">
        <Textarea rows={5} autoResize {...register('description')} />
      </FormField>

      <fieldset className="grid gap-5 rounded-xl border p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold">Thời gian (giờ tại nơi diễn · {timeZone})</legend>
        <DateField control={control} name="startsAt" label="Giờ diễn" error={errors.startsAt?.message} />
        <DateField control={control} name="saleOpensAt" label="Mở bán" error={errors.saleOpensAt?.message} />
        <DateField control={control} name="saleClosesAt" label="Đóng bán" error={errors.saleClosesAt?.message} />
      </fieldset>

      <FormField
        label="Số vé tối đa mỗi tài khoản"
        error={errors.maxTicketsPerUser?.message}
        description="Từ 1 đến 20. Chống một người gom vé."
        className="sm:max-w-xs"
      >
        <Input type="number" min={1} max={20} {...register('maxTicketsPerUser', { valueAsNumber: true })} />
      </FormField>

      <div className="flex items-center justify-end gap-3">
        {!isDirty && (
          <Text size="sm" tone="muted">
            Chưa có thay đổi
          </Text>
        )}
        <Button type="submit" loading={submitting} disabled={!isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function DateField({
  control,
  name,
  label,
  error,
}: {
  control: ReturnType<typeof useForm<EventFormValues>>['control']
  name: 'startsAt' | 'saleOpensAt' | 'saleClosesAt'
  label: string
  error: string | undefined
}) {
  // FormField gắn id/aria cho con trực tiếp của nó, nên DateTimePicker phải nằm ngay trong FormField
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField label={label} error={error} required>
          <DateTimePicker
            value={field.value}
            onValueChange={field.onChange}
            formatOptions={{ dateStyle: 'medium' }}
            timeSuggestions={TIME_SUGGESTIONS}
            hourCycle="h23"
            clearable={false}
          />
        </FormField>
      )}
    />
  )
}
