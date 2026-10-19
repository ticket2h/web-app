import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
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

import { identityApi } from '../../shared/api/client'
import { ApiError, errorMessage, unwrap } from '../../shared/api/problem'
import type { LoginResponse } from '../../shared/api/types'
import { startSession } from '../../shared/auth/session'
import { safeNext } from './safeNext'

const schema = z
  .object({
    fullName: z.string().trim().min(1, 'Nhập họ tên').max(200, 'Tối đa 200 ký tự'),
    email: z.string().trim().min(1, 'Nhập email').pipe(z.email('Email không hợp lệ')),
    password: z.string().min(8, 'Mật khẩu ít nhất 8 ký tự').max(100, 'Tối đa 100 ký tự'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, { path: ['confirm'], message: 'Mật khẩu nhập lại không khớp' })

type FormValues = z.infer<typeof schema>

/** Đăng ký tài khoản khách hàng rồi đăng nhập luôn (identity đặt cookie refresh ở bước đăng nhập). */
function useRegister() {
  return useMutation({
    mutationFn: async ({ fullName, email, password }: FormValues) => {
      unwrap(await identityApi.POST('/auth/register', { body: { fullName, email, password } }))
      const login = unwrap(await identityApi.POST('/auth/login', { body: { email, password } })) as LoginResponse
      return startSession(login)
    },
  })
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const registerAccount = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirm: '' },
  })

  const onSubmit = handleSubmit((values) =>
    registerAccount.mutate(values, { onSuccess: () => navigate(next, { replace: true }) }),
  )

  return (
    <Container size="sm" className="py-12">
      <Card className="mx-auto max-w-md" padding="lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>Để đặt vé, nhận vé QR qua email và chuyển vé cho bạn bè.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {registerAccount.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {registerError(registerAccount.error)}
              </Alert>
            )}
            <FormField label="Họ tên" error={errors.fullName?.message} required>
              <Input autoComplete="name" autoFocus {...register('fullName')} />
            </FormField>
            <FormField label="Email" error={errors.email?.message} required>
              <Input type="email" autoComplete="email" {...register('email')} />
            </FormField>
            <FormField label="Mật khẩu" error={errors.password?.message} required description="Ít nhất 8 ký tự.">
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </FormField>
            <FormField label="Nhập lại mật khẩu" error={errors.confirm?.message} required>
              <Input type="password" autoComplete="new-password" {...register('confirm')} />
            </FormField>
            <Button type="submit" fullWidth loading={registerAccount.isPending}>
              Tạo tài khoản
            </Button>
          </form>
          <Text size="sm" tone="muted" align="center" className="mt-6">
            Đã có tài khoản?{' '}
            <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </Text>
        </CardContent>
      </Card>
    </Container>
  )
}

function registerError(error: unknown): string {
  if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_REGISTERED') {
    return 'Email này đã có tài khoản. Đăng nhập hoặc dùng email khác.'
  }
  return errorMessage(error)
}
