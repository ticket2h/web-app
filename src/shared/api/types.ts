import type { components as CoreComponents } from './generated/core'
import type { components as IdentityComponents } from './generated/identity'

/**
 * Record Java không mang thông tin "bắt buộc", nên springdoc ghi mọi trường của response là tùy chọn. `Defined`
 * bỏ dấu `?` cho những kiểu đã kiểm tra là luôn có giá trị (cột NOT NULL trong DB). Trường có thể null thì khai báo
 * lại rõ ràng như `User.organizerId`.
 */
export type Defined<T> = { [K in keyof T]-?: Exclude<T[K], undefined> }

type CoreSchema = CoreComponents['schemas']
type IdentitySchema = IdentityComponents['schemas']

export type Role = NonNullable<IdentitySchema['UserResponse']['role']>

export type User = Omit<Defined<IdentitySchema['UserResponse']>, 'organizerId'> & {
  /** Chỉ có với ORGANIZER. */
  organizerId: string | null
}

export type LoginResponse = Omit<Defined<IdentitySchema['LoginResponse']>, 'user'> & { user: User }

export type EventSummary = Defined<CoreSchema['EventSummary']>

export type EventPage = Omit<Defined<CoreSchema['EventPage']>, 'items'> & { items: EventSummary[] }
