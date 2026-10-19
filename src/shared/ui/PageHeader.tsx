import { cn, Heading, Text } from 'momi-ui'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Dòng chữ nhỏ phía trên tiêu đề, ví dụ "Ban tổ chức". */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <Text size="xs" weight="semibold" className="mb-2 uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </Text>
        )}
        <Heading as="h1" size="3xl" weight="bold">
          {title}
        </Heading>
        {description && (
          <Text tone="muted" className="mt-2 max-w-2xl">
            {description}
          </Text>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
