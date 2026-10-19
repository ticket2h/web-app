import { cn, Text } from 'momi-ui'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/** Chỗ trống có viền đứt: danh sách rỗng, chưa có dữ liệu. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center', className)}>
      {icon && <div className="mb-4 text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <Text weight="semibold">{title}</Text>
      {description && (
        <Text size="sm" tone="muted" className="mt-1 max-w-md">
          {description}
        </Text>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
