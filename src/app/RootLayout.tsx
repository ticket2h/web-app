import { LogOut, Moon, ReceiptText, Sun, Ticket, UserRound } from 'lucide-react'
import {
  Badge,
  Button,
  Container,
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
        variant="solid"
        className="border-transparent"
        brand={
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tighter">
            <Brand />
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
      <Footer links={navLinks(session?.user.role ?? null, location.pathname)} />
    </div>
  )
}

/** Logo: ô chanh xoay nghiêng có hình vé, cạnh tên app. */
function Brand() {
  return (
    <>
      <span className="grid size-9 -rotate-8 place-items-center rounded-md bg-brand text-brand-foreground">
        <Ticket className="size-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      Ticket2h
    </>
  )
}

/** Chân trang: giới thiệu ngắn, các mục điều hướng, chữ TICKET2H cỡ lớn chìm vào nền, ghi chú dự án. */
function Footer({ links }: { links: { label: string; href: string }[] }) {
  return (
    <footer className="overflow-hidden border-t text-muted-foreground">
      <Container size="xl" className="flex flex-col gap-8 pt-14 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tighter text-foreground">
            <Brand />
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            Chọn ghế, thanh toán và nhận vé QR cho concert, kịch, hài độc thoại và lễ hội.
          </p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <ul className="flex flex-wrap gap-x-8 text-sm font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="inline-flex h-11 items-center transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container size="xl">
        <div
          aria-hidden
          className="mt-10 select-none whitespace-nowrap font-display text-[clamp(4rem,17vw,15.5rem)] font-extrabold leading-[0.78] tracking-[-0.06em] text-foreground/[0.06]"
        >
          TICKET2H
        </div>
        <p className="py-6 text-sm">Dự án học tập: microservice Spring Boot, thanh toán qua cổng giả lập MockPay.</p>
      </Container>
    </footer>
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
            <Button variant="ghost" className="rounded-full" leftIcon={<UserRound className="size-4" aria-hidden />}>
              <span className="max-w-40 truncate">{session.user.fullName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="truncate">{session.user.email}</span>
              <Badge size="sm" tone="primary" shape="rounded" className="self-start">
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
