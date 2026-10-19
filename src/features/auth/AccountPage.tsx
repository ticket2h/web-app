import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Alert, Avatar, Badge, Card, CardContent, Container, SkeletonText, Text } from 'momi-ui'
import { Link } from 'react-router'

import { identityApi } from '../../shared/api/client'
import { errorMessage, unwrap } from '../../shared/api/problem'
import type { Role, User } from '../../shared/api/types'
import { PageHeader } from '../../shared/ui/PageHeader'

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  ORGANIZER: 'Ban tổ chức',
  STAFF: 'Nhân viên soát vé',
  ADMIN: 'Quản trị',
}

const SHORTCUTS: Record<Role, { href: string; title: string; description: string }[]> = {
  CUSTOMER: [
    { href: '/me/tickets', title: 'Vé của tôi', description: 'Mã QR để vào cổng, chuyển vé cho bạn bè' },
    { href: '/me/orders', title: 'Đơn hàng', description: 'Đơn đang chờ thanh toán và đã mua' },
  ],
  ORGANIZER: [{ href: '/organizer', title: 'Sự kiện của bạn', description: 'Tạo sự kiện, loại vé, sơ đồ ghế, nhân viên' }],
  STAFF: [{ href: '/checkin', title: 'Soát vé', description: 'Quét mã QR ở cổng' }],
  ADMIN: [{ href: '/admin', title: 'Quản trị', description: 'Tài khoản và ban tổ chức' }],
}

/** Tài khoản đang đăng nhập, đọc từ identity (GET /me): kiểm tra access token và refresh chạy đúng. */
export function AccountPage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => unwrap(await identityApi.GET('/me')) as User,
  })

  return (
    <Container size="sm" className="py-10">
      <PageHeader eyebrow="Tài khoản" title="Thông tin của bạn" />
      <Card padding="lg">
        <CardContent>
          {me.isPending && <SkeletonText lines={3} />}
          {me.isError && (
            <Alert tone="danger" variant="soft">
              {errorMessage(me.error)}
            </Alert>
          )}
          {me.data && (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar name={me.data.fullName} size="lg" />
              <dl className="grid flex-1 grid-cols-[7rem_1fr] gap-y-3 text-sm">
                <dt className="text-muted-foreground">Họ tên</dt>
                <dd className="font-medium">{me.data.fullName}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{me.data.email}</dd>
                <dt className="text-muted-foreground">Vai trò</dt>
                <dd>
                  <Badge tone="primary" size="sm">
                    {ROLE_LABELS[me.data.role]}
                  </Badge>
                </dd>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>
      {me.data && (
        <ul className="mt-6 flex flex-col gap-3">
          {SHORTCUTS[me.data.role].map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="group flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/25"
              >
                <div>
                  <Text weight="semibold">{item.title}</Text>
                  <Text size="sm" tone="muted">
                    {item.description}
                  </Text>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
