import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Search, UserPlus } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
  NativeSelect,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  toast,
  type DataTableColumnDef,
} from 'momi-ui'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { z } from 'zod'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { Organizer, Role, User } from '../../shared/api/types'
import { PageHeader } from '../../shared/ui/PageHeader'
import { QueryError } from '../../shared/ui/QueryError'
import { useCreateOrganizer, useCreateUser, useOrganizers, useUsers } from './api'

const ROLES: { value: Role; label: string; tone: 'neutral' | 'primary' | 'info' | 'warning' }[] = [
  { value: 'CUSTOMER', label: 'Khách hàng', tone: 'neutral' },
  { value: 'ORGANIZER', label: 'Ban tổ chức', tone: 'primary' },
  { value: 'STAFF', label: 'Soát vé', tone: 'info' },
  { value: 'ADMIN', label: 'Quản trị', tone: 'warning' },
]
const ROLE_VIEW = new Map(ROLES.map((r) => [r.value, r]))

function isRole(value: string | null): value is Role {
  return ROLES.some((r) => r.value === value)
}

export function AdminPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'organizers' ? 'organizers' : 'users'

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Quản trị"
        title="Tài khoản và ban tổ chức"
        description="Khách hàng tự đăng ký. Tài khoản ban tổ chức, soát vé và quản trị do quản trị viên tạo ở đây."
      />
      <Tabs value={tab} onValueChange={(value) => setParams(value === 'users' ? {} : { tab: value })}>
        <TabsList>
          <TabsTrigger value="users">Tài khoản</TabsTrigger>
          <TabsTrigger value="organizers">Ban tổ chức</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="pt-6">
          <UsersTab />
        </TabsContent>
        <TabsContent value="organizers" className="pt-6">
          <OrganizersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UsersTab() {
  const [params, setParams] = useSearchParams()
  const role = isRole(params.get('role')) ? (params.get('role') as Role) : null
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const users = useUsers({ role, q })
  const rows = users.data?.pages.flatMap((page) => page.items) ?? []
  const organizers = useOrganizers()
  const organizerName = new Map((organizers.data ?? []).map((o) => [o.id, o.name]))

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const trimmed = draft.trim()
    if (trimmed === q) return
    const timer = setTimeout(() => update({ q: trimmed || null }), 300)
    return () => clearTimeout(timer)
  }, [draft, q])

  const columns: DataTableColumnDef<User>[] = [
    { id: 'fullName', header: 'Họ tên', accessor: 'fullName', width: 220 },
    { id: 'email', header: 'Email', accessor: 'email', width: 260 },
    {
      id: 'role',
      header: 'Vai trò',
      accessor: 'role',
      width: 140,
      cell: ({ row }) => {
        const view = ROLE_VIEW.get(row.role)!
        return (
          <Badge tone={view.tone} size="sm">
            {view.label}
          </Badge>
        )
      },
    },
    {
      id: 'organizer',
      header: 'Ban tổ chức',
      accessor: (row) => (row.organizerId ? (organizerName.get(row.organizerId) ?? '') : ''),
      width: 200,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="search"
            aria-label="Tìm tài khoản"
            placeholder="Tìm theo email hoặc tên"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            leftSection={<Search className="size-4" aria-hidden />}
            wrapperClassName="sm:w-72"
          />
          <NativeSelect
            aria-label="Lọc theo vai trò"
            value={role ?? ''}
            onChange={(event) => update({ role: event.target.value || null })}
            wrapperClassName="sm:w-48"
          >
            <option value="">Mọi vai trò</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <CreateUserDialog organizers={organizers.data ?? []} />
      </div>

      {users.isPending && <Skeleton className="h-80 rounded-xl" />}
      {users.isError && <QueryError title="Không tải được tài khoản" error={users.error} onRetry={() => users.refetch()} />}
      {users.data && (
        <>
          <DataTable
            aria-label="Tài khoản"
            data={rows}
            columns={columns}
            variant="card"
            emptyState="Không có tài khoản nào khớp bộ lọc"
          />
          <div className="flex flex-col items-center gap-2">
            <Text size="sm" tone="muted" aria-live="polite">
              Đang xem {rows.length.toLocaleString('vi-VN')} tài khoản{users.hasNextPage ? '' : ', đã hết danh sách'}
            </Text>
            {users.hasNextPage && (
              <Button variant="outline" loading={users.isFetchingNextPage} onClick={() => users.fetchNextPage()}>
                Xem thêm
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const userSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Nhập họ tên').max(200, 'Tối đa 200 ký tự'),
    email: z.string().trim().min(1, 'Nhập email').pipe(z.email('Email không hợp lệ')),
    password: z.string().min(8, 'Ít nhất 8 ký tự').max(100, 'Tối đa 100 ký tự'),
    role: z.enum(['CUSTOMER', 'ORGANIZER', 'STAFF', 'ADMIN']),
    organizerId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.role === 'ORGANIZER' && !values.organizerId) {
      ctx.addIssue({ code: 'custom', path: ['organizerId'], message: 'Chọn ban tổ chức' })
    }
  })

type UserValues = z.infer<typeof userSchema>

function CreateUserDialog({ organizers }: { organizers: Organizer[] }) {
  const [open, setOpen] = useState(false)
  const create = useCreateUser()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'STAFF', organizerId: '' },
  })
  const role = watch('role')

  const onSubmit = handleSubmit((values) =>
    create.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        organizerId: values.role === 'ORGANIZER' ? values.organizerId : undefined,
      },
      {
        onSuccess: (user) => {
          toast.success(`Đã tạo tài khoản ${user.email}`)
          reset()
          setOpen(false)
        },
      },
    ),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button leftIcon={<UserPlus className="size-4" />}>Tạo tài khoản</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản</DialogTitle>
            <DialogDescription>Gửi mật khẩu cho người dùng qua kênh riêng; họ đăng nhập bằng email này.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {create.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {create.error instanceof ApiError && create.error.code === 'EMAIL_ALREADY_REGISTERED'
                  ? 'Email này đã có tài khoản.'
                  : errorMessage(create.error)}
              </Alert>
            )}
            <FormField label="Họ tên" error={errors.fullName?.message} required>
              <Input autoFocus {...register('fullName')} />
            </FormField>
            <FormField label="Email" error={errors.email?.message} required>
              <Input type="email" autoComplete="off" {...register('email')} />
            </FormField>
            <FormField label="Mật khẩu" error={errors.password?.message} required description="Ít nhất 8 ký tự.">
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Vai trò" required>
                <NativeSelect {...register('role')}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              {role === 'ORGANIZER' && (
                <FormField label="Ban tổ chức" error={errors.organizerId?.message} required>
                  <NativeSelect placeholder="Chọn ban tổ chức" {...register('organizerId')}>
                    {organizers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={create.isPending}>
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OrganizersTab() {
  const organizers = useOrganizers()
  const create = useCreateOrganizer()
  const [name, setName] = useState('')

  const columns: DataTableColumnDef<Organizer>[] = [
    { id: 'name', header: 'Tên ban tổ chức', accessor: 'name', width: 320, sortable: true },
    {
      id: 'id',
      header: 'Mã',
      accessor: 'id',
      width: 340,
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.id}</span>,
    },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        {organizers.isPending && <Skeleton className="h-60 rounded-xl" />}
        {organizers.isError && (
          <QueryError title="Không tải được ban tổ chức" error={organizers.error} onRetry={() => organizers.refetch()} />
        )}
        {organizers.data && (
          <DataTable aria-label="Ban tổ chức" data={organizers.data} columns={columns} variant="card" emptyState="Chưa có ban tổ chức nào" />
        )}
      </div>
      <form
        className="flex flex-col gap-3 self-start rounded-xl border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          create.mutate(name.trim(), {
            onSuccess: (organizer) => {
              toast.success(`Đã tạo ${organizer.name}. Giờ tạo tài khoản ban tổ chức cho họ ở tab Tài khoản.`)
              setName('')
            },
          })
        }}
      >
        <Text weight="semibold" className="flex items-center gap-2">
          <Building2 className="size-4" aria-hidden /> Thêm ban tổ chức
        </Text>
        {create.isError && (
          <Alert tone="danger" variant="soft" role="alert">
            {errorMessage(create.error)}
          </Alert>
        )}
        <FormField label="Tên">
          <Input value={name} maxLength={200} placeholder="Sky Entertainment" onChange={(e) => setName(e.target.value)} />
        </FormField>
        <Button type="submit" loading={create.isPending} disabled={!name.trim()}>
          Thêm
        </Button>
      </form>
    </div>
  )
}
