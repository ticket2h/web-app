import { Button, Container, Heading, Spinner, Text } from 'momi-ui'
import { createBrowserRouter, Link, type RouteObject } from 'react-router'

import { LoginPage } from '../features/auth/LoginPage'
import { EventsPage } from '../features/events/EventsPage'
import { RequireAuth } from '../shared/auth/RequireAuth'
import { RequireRole } from '../shared/auth/RequireRole'
import { RootLayout } from './RootLayout'

/**
 * Trang chủ và đăng nhập nằm trong bundle chính; các trang khác tải khi mở lần đầu (`lazy`), để khách xem sự kiện
 * không phải tải code của ban tổ chức, soát vé, quản trị.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    hydrateFallbackElement: <PageLoading />,
    children: [
      { path: '/', element: <EventsPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', lazy: async () => ({ Component: (await import('../features/auth/RegisterPage')).RegisterPage }) },
      { path: '/events/:eventId', lazy: async () => ({ Component: (await import('../features/events/EventDetailPage')).EventDetailPage }) },
      // MockPay chuyển trình duyệt về đây sau khi thanh toán (return-url của core-service)
      { path: '/payments/return', lazy: async () => ({ Component: (await import('../features/orders/PaymentReturnPage')).PaymentReturnPage }) },
      {
        element: <RequireAuth />,
        children: [
          { path: '/account', lazy: async () => ({ Component: (await import('../features/auth/AccountPage')).AccountPage }) },
          { path: '/me/tickets', lazy: async () => ({ Component: (await import('../features/tickets/TicketsPage')).TicketsPage }) },
          { path: '/me/orders', lazy: async () => ({ Component: (await import('../features/orders/OrdersPage')).OrdersPage }) },
          { path: '/orders/:orderId', lazy: async () => ({ Component: (await import('../features/orders/OrderPage')).OrderPage }) },
        ],
      },
      {
        element: <RequireRole roles={['ORGANIZER']} />,
        children: [
          { path: '/organizer', lazy: async () => ({ Component: (await import('../features/organizer/OrganizerHome')).OrganizerHome }) },
          { path: '/organizer/events/new', lazy: async () => ({ Component: (await import('../features/organizer/NewEventPage')).NewEventPage }) },
          { path: '/organizer/events/:eventId', lazy: async () => ({ Component: (await import('../features/organizer/OrganizerEventPage')).OrganizerEventPage }) },
        ],
      },
      {
        element: <RequireRole roles={['STAFF']} />,
        children: [{ path: '/checkin', lazy: async () => ({ Component: (await import('../features/checkin/CheckinPage')).CheckinPage }) }],
      },
      {
        element: <RequireRole roles={['ADMIN']} />,
        children: [{ path: '/admin', lazy: async () => ({ Component: (await import('../features/admin/AdminPage')).AdminPage }) }],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export const router = createBrowserRouter(routes)

function PageLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner size="lg" />
    </div>
  )
}

function NotFound() {
  return (
    <Container size="sm" className="py-20 text-center">
      <div className="font-display text-8xl font-extrabold tracking-tight text-primary">404</div>
      <Heading as="h1" className="mt-4">
        Không tìm thấy trang
      </Heading>
      <Text tone="muted" className="mt-2">
        Đường dẫn không tồn tại hoặc đã bị đổi.
      </Text>
      <Button asChild className="mt-6">
        <Link to="/">Về trang sự kiện</Link>
      </Button>
    </Container>
  )
}
