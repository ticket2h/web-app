import { Search } from 'lucide-react'
import { Alert, Button, Container, Grid, Heading, Input, Pagination, Skeleton, Text } from 'momi-ui'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { errorMessage } from '../../shared/api/problem'
import { PAGE_SIZE, useEvents } from './api'
import { EventCard } from './EventCard'

const SEARCH_DELAY_MS = 300

/** Sự kiện đang công bố. Từ khoá và trang nằm trên URL (?q=&page=) để chia sẻ link và bấm Back được. */
export function EventsPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [draft, setDraft] = useState(q)

  // Gõ xong mới tìm, không gọi API mỗi phím. Đổi từ khoá thì về trang 1.
  useEffect(() => {
    const trimmed = draft.trim()
    if (trimmed === q) return
    const timer = setTimeout(
      () => setParams(trimmed ? { q: trimmed } : {}, { replace: true }),
      SEARCH_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [draft, q, setParams])

  const events = useEvents(q, page - 1)
  const pageCount = events.data ? Math.max(1, Math.ceil(events.data.total / PAGE_SIZE)) : 1

  const goToPage = (next: number) => {
    const nextParams = new URLSearchParams(params)
    if (next > 1) nextParams.set('page', String(next))
    else nextParams.delete('page')
    setParams(nextParams)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <div className="poster-dots absolute inset-0 -z-10 text-foreground/[0.07]" aria-hidden />
        <Container size="xl" className="py-14 md:py-20">
          <Text size="xs" weight="semibold" className="uppercase tracking-[0.22em] text-primary">
            Concert · Show diễn · Lễ hội
          </Text>
          <Heading as="h1" weight="bold" className="mt-4 max-w-3xl text-5xl leading-[0.95] md:text-7xl">
            Đêm nay đi đâu?
          </Heading>
          <Text size="lg" tone="muted" className="mt-5 max-w-xl">
            Chọn ghế, thanh toán, nhận vé QR qua email trong vài phút.
          </Text>
          <Input
            type="search"
            size="lg"
            aria-label="Tìm sự kiện"
            placeholder="Tìm theo tên, địa điểm, thành phố… (gõ không dấu cũng được)"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            leftSection={<Search className="size-4" aria-hidden />}
            wrapperClassName="mt-8 max-w-xl bg-card shadow-sm"
          />
        </Container>
      </section>

      <Container size="xl" className="py-10">
      {events.isPending && <EventGridSkeleton />}

      {events.isError && (
        <Alert
          tone="danger"
          variant="soft"
          title="Không tải được danh sách sự kiện"
          action={
            <Button size="sm" variant="outline" onClick={() => events.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(events.error)}
        </Alert>
      )}

      {events.data && events.data.items.length === 0 && (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Text weight="medium">
            {q ? `Không có sự kiện nào khớp "${q}"` : 'Chưa có sự kiện nào đang mở'}
          </Text>
          {q && (
            <Button variant="link" className="mt-2" onClick={() => setDraft('')}>
              Xoá từ khoá
            </Button>
          )}
        </div>
      )}

      {events.data && events.data.items.length > 0 && (
        <>
          <Text size="sm" tone="muted" className="mb-6">
            {events.data.total} sự kiện
          </Text>
          <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={8} aria-busy={events.isFetching}>
            {events.data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Grid>
          {pageCount > 1 && (
            <Pagination
              className="mt-8 justify-center"
              pageCount={pageCount}
              page={page}
              onPageChange={goToPage}
            />
          )}
        </>
      )}
      </Container>
    </>
  )
}

function EventGridSkeleton() {
  return (
    <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={8} aria-label="Đang tải">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
      ))}
    </Grid>
  )
}
