import type { components as CoreComponents } from './generated/core'
import type { components as IdentityComponents } from './generated/identity'

/**
 * Record Java không mang thông tin "bắt buộc", nên springdoc ghi mọi trường của response là tùy chọn. `Defined`
 * bỏ dấu `?` cho những kiểu đã kiểm tra là luôn có giá trị (cột NOT NULL trong DB, kiểu nguyên thủy trong record).
 * Trường có thể null thì khai báo lại rõ ràng, kèm lý do.
 */
export type Defined<T> = { [K in keyof T]-?: Exclude<T[K], undefined> }

type CoreSchema = CoreComponents['schemas']
type IdentitySchema = IdentityComponents['schemas']

// ---- identity-service

export type Role = NonNullable<IdentitySchema['UserResponse']['role']>

export type User = Omit<Defined<IdentitySchema['UserResponse']>, 'organizerId'> & {
  /** Chỉ có với ORGANIZER. */
  organizerId: string | null
}

export type LoginResponse = Omit<Defined<IdentitySchema['LoginResponse']>, 'user'> & { user: User }

export type Organizer = Defined<IdentitySchema['OrganizerResponse']>

/** Phân trang keyset: gửi lại `nextCursor` để lấy trang sau; `null` là hết danh sách. Không có tổng số. */
export type UserPage = Omit<Defined<IdentitySchema['UserPageResponse']>, 'items' | 'nextCursor'> & {
  items: User[]
  nextCursor: string | null
}

export type CreateUserRequest = IdentitySchema['CreateUserRequest']

// ---- core-service: sự kiện công khai

export type EventSummary = Defined<CoreSchema['EventSummary']>

export type EventPage = Omit<Defined<CoreSchema['EventPage']>, 'items'> & { items: EventSummary[] }

export type TicketKind = NonNullable<CoreSchema['TicketTypeView']['kind']>

/** `available`: số vé GA còn lại, hoặc số ghế còn trống với loại SEATED. */
export type TicketTypeView = Defined<CoreSchema['TicketTypeView']>

export type Venue = Defined<CoreSchema['VenueView']>

/** `description` là chuỗi rỗng khi ban tổ chức không nhập (BE không trả null). */
export type EventDetail = Omit<Defined<CoreSchema['EventDetail']>, 'venue' | 'ticketTypes'> & {
  venue: Venue
  ticketTypes: TicketTypeView[]
}

/** Trạng thái hiệu lực: ghế HELD đã quá hạn giữ được BE trả là AVAILABLE. */
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD'

export type Seat = Omit<Defined<CoreSchema['SeatView']>, 'status'> & { status: SeatStatus }

// ---- core-service: đơn hàng, thanh toán

export type OrderStatus = NonNullable<CoreSchema['OrderResponse']['status']>

/** `seatId` null với vé GA (khi đó `quantity` là số vé), có giá trị với vé ngồi (`quantity` = 1). */
export type OrderItem = Omit<Defined<CoreSchema['ItemResponse']>, 'seatId'> & { seatId: string | null }

/** `expiresAt`: hạn giữ chỗ; `paidAt` null tới khi thanh toán thành công. */
export type Order = Omit<Defined<CoreSchema['OrderResponse']>, 'items' | 'paidAt' | 'expiresAt'> & {
  items: OrderItem[]
  expiresAt: string | null
  paidAt: string | null
}

export type OrderSummary = Defined<CoreSchema['OrderSummary']>

export type Payment = Defined<CoreSchema['PaymentResponse']>

// ---- core-service: vé, soát vé

export type TicketStatus = NonNullable<CoreSchema['TicketResponse']['status']>

/** `seat` null với vé GA; `checkedInAt`, `checkedInGate` null tới khi vé được quét. */
export type Ticket = Omit<Defined<CoreSchema['TicketResponse']>, 'seat' | 'checkedInAt' | 'checkedInGate'> & {
  seat: string | null
  checkedInAt: string | null
  checkedInGate: string | null
}

export type CheckinResult = NonNullable<CoreSchema['CheckinResponse']['result']>

/** Mã QR sai hoặc không đọc được thì không có `ticket` và giờ check-in. */
export interface CheckinResponse {
  result: CheckinResult
  message: string
  ticket: { ticketType: string; seat: string | null } | null
  checkedInAt: string | null
  checkedInGate: string | null
}

// ---- core-service: ban tổ chức

export type EventStatus = NonNullable<CoreSchema['EventResponse']['status']>

export type OrganizerEvent = Defined<CoreSchema['EventResponse']>

export type OrganizerVenue = Defined<CoreSchema['VenueResponse']>

/**
 * GA: `totalQuantity`, `availableQuantity` có giá trị, `seatCount` null.
 * SEATED: `seatCount` là số ghế đã tạo, hai trường số lượng null.
 */
export type OrganizerTicketType = Omit<
  Defined<CoreSchema['TicketTypeResponse']>,
  'totalQuantity' | 'availableQuantity' | 'seatCount'
> & {
  totalQuantity: number | null
  availableQuantity: number | null
  seatCount: number | null
}

export type OrganizerEventDetail = {
  event: OrganizerEvent
  ticketTypes: OrganizerTicketType[]
  staffUserIds: string[]
}

/** `email`, `fullName` null khi tài khoản đã bị xoá ở identity-service. */
export type StaffMember = {
  userId: string
  email: string | null
  fullName: string | null
}

export type EventRequest = CoreSchema['EventRequest']
export type TicketTypeRequest = CoreSchema['TicketTypeRequest']
export type SeatSectionRequest = CoreSchema['SeatSectionRequest']
export type CreateOrderRequest = CoreSchema['CreateOrderRequest']

// ---- core-service: báo cáo, đơn, file của ban tổ chức (M4)

export type SalesGroupBy = NonNullable<CoreSchema['SalesReportResponse']['groupBy']>
export type SalesSort = NonNullable<CoreSchema['SalesReportResponse']['sort']>
export type SortDirection = NonNullable<CoreSchema['SalesReportResponse']['direction']>
export type SalesChannel = NonNullable<CoreSchema['OrganizerOrderRow']['salesChannel']>

export type SalesTotals = Defined<CoreSchema['SalesTotals']>

/**
 * `key`: ngày YYYY-MM-DD, id loại vé hoặc mã kênh tuỳ `groupBy`. `label`: tên loại vé, null với hai cách gom kia.
 * `orders`: null khi gom theo loại vé (một đơn có thể mua nhiều loại vé).
 */
export type SalesRow = Omit<Defined<CoreSchema['SalesRow']>, 'label' | 'orders'> & {
  label: string | null
  orders: number | null
}

/** `from`, `to`: null khi không lọc theo ngày. */
export type SalesReport = Omit<Defined<CoreSchema['SalesReportResponse']>, 'totals' | 'rows' | 'from' | 'to'> & {
  totals: SalesTotals
  rows: SalesRow[]
  from: string | null
  to: string | null
}

/** `paidAt` null khi đơn chưa trả tiền; `buyer` null khi tài khoản người mua không còn ở identity. */
export type OrganizerOrderRow = Omit<Defined<CoreSchema['OrganizerOrderRow']>, 'paidAt' | 'buyer'> & {
  paidAt: string | null
  buyer: Defined<CoreSchema['OrderBuyer']> | null
}

/** Phân trang keyset như {@link UserPage}. */
export type OrganizerOrderPage = Omit<Defined<CoreSchema['OrganizerOrderPage']>, 'items' | 'nextCursor'> & {
  items: OrganizerOrderRow[]
  nextCursor: string | null
}

export type SeatImportResult = Omit<Defined<CoreSchema['SeatImportResponse']>, 'ticketTypes'> & {
  ticketTypes: Defined<CoreSchema['SeatImportCount']>[]
}

/** Một dòng lỗi trong ProblemDetail SEAT_IMPORT_INVALID (`errors`, kèm `errorCount` là tổng số lỗi). */
export interface SeatImportError {
  line: number
  message: string
}
