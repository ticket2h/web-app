import { Button, Container, Heading, Text } from 'momi-ui'
import { createBrowserRouter, Link } from 'react-router'

import { AccountPage } from '../features/auth/AccountPage'
import { LoginPage } from '../features/auth/LoginPage'
import { EventsPage } from '../features/events/EventsPage'
import { RequireAuth } from '../shared/auth/RequireAuth'
import { RootLayout } from './RootLayout'

export const routes = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <EventsPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export const router = createBrowserRouter(routes)

function NotFound() {
  return (
    <Container size="sm" className="py-20 text-center">
      <Heading as="h1">Không tìm thấy trang</Heading>
      <Text tone="muted" className="mt-2">
        Đường dẫn không tồn tại hoặc đã bị đổi.
      </Text>
      <Button asChild className="mt-6">
        <Link to="/">Về trang sự kiện</Link>
      </Button>
    </Container>
  )
}
