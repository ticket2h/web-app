import { LogOut, Moon, ReceiptText, Sun, Ticket, UserRound } from 'lucide-react'
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
  useTheme,
} from 'momi-ui'
import type { MouseEvent } from 'react'
import { Link, Outlet, useLocation, useNavigate, useNavigation } from 'react-router'

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
  const navigation = useNavigation()
  const session = useSession()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar
        brand={
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Ticket className="size-4" aria-hidden />
            </span>
            Ticket2h
          </Link>
        }
        links={navLinks(session?.user.role ?? null, location.pathname)}
        actions={<NavbarActions />}
        onClickCapture={(event) => navigateInApp(event, navigate)}
      />
      {/* Đang tải code của trang kế tiếp (route lazy) */}
      <div
        aria-hidden
        className={`fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary transition-transform duration-500 ${
          navigation.state === 'loading' ? 'scale-x-75' : 'scale-x-0'
        }`}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="font-display font-bold text-foreground">Ticket2h</span>
          <span>Dự án học tập: microservice Spring Boot, thanh toán qua cổng giả lập MockPay.</span>
        </div>
      </footer>
    </div>
  )
}

/** Mục điều hướng theo vai trò. Trang chỉ ẩn/hiện link; quyền thật do BE kiểm tra. */
function navLinks(role: Role | null, pathname: string) {
  const links = [{ label: 'Sự kiện', href: '/', active: pathname === '/' || pathname.startsWith('/events/') }]
  const add = (label: string, href: string, prefixes: string[] = [href]) =>
    links.push({ label, href, active: prefixes.some((p) => pathname.startsWith(p)) })
  if (role === 'CUSTOMER') {
    add('Vé của tôi', '/me/tickets')
    add('Đơn hàng', '/me/orders', ['/me/orders', '/orders/'])
  }
  if (role === 'ORGANIZER') add('Ban tổ chức', '/organizer')
  if (role === 'STAFF') add('Soát vé', '/checkin')
  if (role === 'ADMIN') add('Quản trị', '/admin')
  return links
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
              <span className="max-w-40 truncate">{session.user.fullName}</span>
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
            {session.user.role === 'CUSTOMER' && (
              <>
                <DropdownMenuItem onSelect={() => navigate('/me/tickets')}>
                  <Ticket className="size-4" aria-hidden /> Vé của tôi
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/me/orders')}>
                  <ReceiptText className="size-4" aria-hidden /> Đơn hàng
                </DropdownMenuItem>
              </>
            )}
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
