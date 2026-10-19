import { zodResolver } from '@hookform/resolvers/zod'
import { UserMinus, UserPlus, Users } from 'lucide-react'
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  Button,
  Card,
  CardContent,
  FormField,
  IconButton,
  Input,
  Skeleton,
  Text,
  toast,
} from 'momi-ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiError, errorMessage } from '../../shared/api/problem'
import type { StaffMember } from '../../shared/api/types'
import { EmptyState } from '../../shared/ui/EmptyState'
import { QueryError } from '../../shared/ui/QueryError'
import { useAssignStaff, useRemoveStaff, useStaff } from './api'

const schema = z.object({
  email: z.string().trim().min(1, 'Nhập email').pipe(z.email('Email không hợp lệ')),
})

export function StaffPanel({ eventId }: { eventId: string }) {
  const staff = useStaff(eventId)
  const assign = useAssignStaff(eventId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(({ email }) =>
    assign.mutate(email, {
      onSuccess: () => {
        toast.success(`Đã phân công ${email}`)
        reset()
        staff.refetch()
      },
    }),
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-label="Nhân viên đã phân công">
        {staff.isPending && <Skeleton className="h-40 rounded-xl" />}
        {staff.isError && (
          <QueryError title="Không tải được danh sách nhân viên" error={staff.error} onRetry={() => staff.refetch()} />
        )}
        {staff.data?.length === 0 && (
          <EmptyState
            icon={<Users />}
            title="Chưa phân công ai"
            description="Nhân viên được phân công mới quét được vé của sự kiện này."
          />
        )}
        {staff.data && staff.data.length > 0 && (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {staff.data.map((member) => (
              <StaffRow key={member.userId} eventId={eventId} member={member} onRemoved={() => staff.refetch()} />
            ))}
          </ul>
        )}
      </section>
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <Text weight="semibold">Phân công nhân viên</Text>
            {assign.isError && (
              <Alert tone="danger" variant="soft" role="alert">
                {assignError(assign.error)}
              </Alert>
            )}
            <FormField label="Email tài khoản soát vé" error={errors.email?.message} description="Tài khoản phải có vai trò STAFF (do quản trị tạo).">
              <Input type="email" placeholder="staff1@test.local" {...register('email')} />
            </FormField>
            <Button type="submit" leftIcon={<UserPlus className="size-4" />} loading={assign.isPending}>
              Phân công
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function assignError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NOT_FOUND') return 'Không có tài khoản soát vé nào với email này.'
    if (error.code === 'IDENTITY_UNAVAILABLE') return 'Tạm thời không tra được tài khoản. Thử lại sau ít phút.'
  }
  return errorMessage(error)
}

function StaffRow({ eventId, member, onRemoved }: { eventId: string; member: StaffMember; onRemoved: () => void }) {
  const remove = useRemoveStaff(eventId)
  const name = member.fullName ?? 'Tài khoản đã bị xoá'
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Avatar name={member.fullName ?? '?'} size="sm" />
      <div className="min-w-0 flex-1">
        <Text weight="medium" truncate>
          {name}
        </Text>
        <Text size="sm" tone="muted" truncate>
          {member.email ?? member.userId}
        </Text>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <IconButton variant="ghost" tone="danger" aria-label={`Bỏ phân công ${name}`} loading={remove.isPending}>
            <UserMinus className="size-4" />
          </IconButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ phân công {name}?</AlertDialogTitle>
            <AlertDialogDescription>Người này sẽ không quét được vé của sự kiện nữa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              tone="danger"
              onClick={() =>
                remove.mutate(member.userId, {
                  onSuccess: () => {
                    toast.success(`Đã bỏ phân công ${name}`)
                    onRemoved()
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              Bỏ phân công
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
