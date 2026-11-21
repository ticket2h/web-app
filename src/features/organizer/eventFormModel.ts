import type { DateTimeValue } from 'momi-ui'
import { z } from 'zod'

import type { EventRequest, OrganizerEvent } from '../../shared/api/types'
import { isoToWallTime, wallTimeToIso } from '../../shared/format/zoned'

/** Sự kiện mới luôn ở múi giờ này (core: `OrganizerCatalogService.DEFAULT_ZONE`). */
export const DEFAULT_EVENT_ZONE = 'Asia/Ho_Chi_Minh'

const dateTime = z.custom<DateTimeValue>(
  (value) => {
    const v = value as DateTimeValue | null | undefined
    return Boolean(v?.date && v.time)
  },
  { message: 'Chọn ngày và giờ' },
)

export function eventFormSchema(timeZone: string) {
  return z
    .object({
      venueId: z.string().min(1, 'Chọn địa điểm'),
      title: z.string().trim().min(1, 'Nhập tên sự kiện').max(200, 'Tối đa 200 ký tự'),
      description: z.string().max(5000, 'Tối đa 5000 ký tự'),
      startsAt: dateTime,
      saleOpensAt: dateTime,
      saleClosesAt: dateTime,
      maxTicketsPerUser: z.number({ message: 'Nhập số vé' }).int().min(1, 'Ít nhất 1 vé').max(20, 'Tối đa 20 vé'),
    })
    .superRefine((values, ctx) => {
      const opens = toIso(values.saleOpensAt, timeZone)
      const closes = toIso(values.saleClosesAt, timeZone)
      const starts = toIso(values.startsAt, timeZone)
      if (opens && closes && opens >= closes) {
        ctx.addIssue({ code: 'custom', path: ['saleClosesAt'], message: 'Phải sau giờ mở bán' })
      }
      if (closes && starts && closes > starts) {
        ctx.addIssue({ code: 'custom', path: ['saleClosesAt'], message: 'Phải đóng bán trước hoặc đúng giờ diễn' })
      }
    })
}

export type EventFormValues = z.infer<ReturnType<typeof eventFormSchema>>

/** Ngày + giờ người tổ chức chọn (giờ tại nơi diễn) thành mốc ISO. */
export function toIso(value: DateTimeValue | null | undefined, timeZone: string): string | null {
  if (!value?.date || !value.time) return null
  const date = value.date
  return wallTimeToIso(
    { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), time: value.time },
    timeZone,
  )
}

/** Mốc ISO thành giá trị cho DateTimePicker, hiển thị theo giờ tại nơi diễn. */
export function fromIso(iso: string, timeZone: string): DateTimeValue {
  const wall = isoToWallTime(iso, timeZone)
  return { date: new Date(wall.year, wall.month - 1, wall.day), time: wall.time }
}

export function toEventRequest(values: EventFormValues, timeZone: string): EventRequest {
  return {
    venueId: values.venueId,
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    startsAt: toIso(values.startsAt, timeZone)!,
    saleOpensAt: toIso(values.saleOpensAt, timeZone)!,
    saleClosesAt: toIso(values.saleClosesAt, timeZone)!,
    maxTicketsPerUser: values.maxTicketsPerUser,
  }
}

export function formDefaults(event?: OrganizerEvent): EventFormValues {
  if (!event) {
    const empty = { date: null, time: null }
    return {
      venueId: '',
      title: '',
      description: '',
      startsAt: empty,
      saleOpensAt: empty,
      saleClosesAt: empty,
      maxTicketsPerUser: 4,
    }
  }
  return {
    venueId: event.venueId,
    title: event.title,
    description: event.description,
    startsAt: fromIso(event.startsAt, event.timeZone),
    saleOpensAt: fromIso(event.saleOpensAt, event.timeZone),
    saleClosesAt: fromIso(event.saleClosesAt, event.timeZone),
    maxTicketsPerUser: event.maxTicketsPerUser,
  }
}
