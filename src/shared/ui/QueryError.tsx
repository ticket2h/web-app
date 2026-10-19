import { Alert, Button } from 'momi-ui'

import { errorMessage } from '../api/problem'

interface QueryErrorProps {
  title: string
  error: unknown
  onRetry?: () => void
  className?: string
}

/** Lỗi khi tải dữ liệu, kèm nút thử lại. */
export function QueryError({ title, error, onRetry, className }: QueryErrorProps) {
  return (
    <Alert
      tone="danger"
      variant="soft"
      title={title}
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        )
      }
    >
      {errorMessage(error)}
    </Alert>
  )
}
