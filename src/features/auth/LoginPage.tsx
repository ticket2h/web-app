import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  FormField,
  Input,
  Text,
} from 'momi-ui'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

import { ApiError, errorMessage } from '../../shared/api/problem'
import { useLogin } from './api'
import { safeNext } from './safeNext'

const schema = z.object({
  email: z.string().trim().min(1, 'Nhập email').pipe(z.email('Email không hợp lệ')),
  password: z.string().min(1, 'Nhập mật khẩu'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => navigate(safeNext(params.get('next')), { replace: true }) }),
  )

  return (
    <Container size="sm" className="py-12">
      <Card className="mx-auto max-w-md" padding="lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Đăng nhập để mua vé và xem vé của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {login.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {loginError(login.error)}
              </Alert>
            )}
            <FormField label="Email" error={errors.email?.message} required>
              <Input type="email" autoComplete="username" autoFocus {...register('email')} />
            </FormField>
            <FormField label="Mật khẩu" error={errors.password?.message} required>
              <Input type="password" autoComplete="current-password" {...register('password')} />
            </FormField>
            <Button type="submit" fullWidth loading={login.isPending}>
              Đăng nhập
            </Button>
          </form>
          <Text size="sm" tone="muted" align="center" className="mt-6">
            Chưa có tài khoản?{' '}
            <Link
              to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Đăng ký
            </Link>
          </Text>
          {import.meta.env.DEV && (
            <Text size="sm" tone="muted" className="mt-6">
              Tài khoản mẫu (profile dev): buyer1@test.local, organizer1@test.local, staff1@test.local,
              admin@test.local, mật khẩu Passw0rd!
            </Text>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

function loginError(error: unknown): string {
  if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
    return 'Sai email hoặc mật khẩu'
  }
  return errorMessage(error)
}
