import { LogOut, Moon, Sun, Ticket, UserRound } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Navbar,
  Text,
  useTheme,
} from 'momi-ui'
import type { MouseEvent } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'

import type { Role } from '../shared/api/types'
import { logout } from '../shared/auth/session'
import { useSession } from '../shared/auth/useAuth'

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  ORGANIZER: 'Ban tổ chức',
  STAFF: 'Soát vé',
  ADMIN: 'Quản trị',
}

export function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar
        brand={
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Ticket className="size-5 text-primary" aria-hidden />
            Ticket2h
          </Link>
        }
        links={[{ label: 'Sự kiện', href: '/', active: location.pathname === '/' }]}
        actions={<NavbarActions />}
        onClickCapture={(event) => navigateInApp(event, navigate)}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <Text size="sm" tone="muted" align="center">
          Ticket2h · dự án học tập
        </Text>
      </footer>
    </div>
  )
}

/**
 * Navbar của momi-ui vẽ link là thẻ `<a href>` thường: bấm vào sẽ tải lại cả trang (mất access token trong bộ
 * nhớ). Chặn click vào link nội bộ và chuyển trang bằng React Router. Bỏ khi momi-ui cho truyền component link riêng.
 */
function navigateInApp(event: MouseEvent, navigate: ReturnType<typeof useNavigate>) {
  const anchor = (event.target as HTMLElement).closest('a')
  if (
    !anchor ||
    anchor.target === '_blank' ||
    anchor.origin !== window.location.origin ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }
  event.preventDefault()
  navigate(anchor.pathname + anchor.search + anchor.hash)
}

function NavbarActions() {
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {session ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" leftIcon={<UserRound className="size-4" aria-hidden />}>
              {session.user.fullName}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="truncate">{session.user.email}</span>
              <Badge size="sm" tone="primary" className="self-start">
                {ROLE_LABELS[session.user.role]}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/account')}>
              <UserRound className="size-4" aria-hidden /> Tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="danger"
              onSelect={async () => {
                await logout()
                navigate('/')
              }}
            >
              <LogOut className="size-4" aria-hidden /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        location.pathname !== '/login' && (
          <Button asChild>
            <Link to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}>Đăng nhập</Link>
          </Button>
        )
      )}
    </div>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <IconButton
      variant="ghost"
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </IconButton>
  )
}
