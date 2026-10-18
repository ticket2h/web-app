import { useQuery } from '@tanstack/react-query'
import { Alert, Card, CardContent, CardHeader, CardTitle, Container, Heading, SkeletonText } from 'momi-ui'

import { identityApi } from '../../shared/api/client'
import { errorMessage, unwrap } from '../../shared/api/problem'
import type { User } from '../../shared/api/types'

/** Tài khoản đang đăng nhập, đọc từ identity (GET /me): kiểm tra access token và refresh chạy đúng. */
export function AccountPage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => unwrap(await identityApi.GET('/me')) as User,
  })

  return (
    <Container size="sm" className="py-10">
      <Heading as="h1" className="mb-6">
        Tài khoản
      </Heading>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin</CardTitle>
        </CardHeader>
        <CardContent>
          {me.isPending && <SkeletonText lines={3} />}
          {me.isError && (
            <Alert tone="danger" variant="soft">
              {errorMessage(me.error)}
            </Alert>
          )}
          {me.data && (
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Họ tên</dt>
              <dd>{me.data.fullName}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{me.data.email}</dd>
              <dt className="text-muted-foreground">Vai trò</dt>
              <dd>{me.data.role}</dd>
            </dl>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
