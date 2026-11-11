import { ArrowRight, CalendarDays, MapPin, Search } from 'lucide-react'
import { Alert, Button, cn, Container, Grid, Input, Pagination, Skeleton, Text } from 'momi-ui'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { errorMessage } from '../../shared/api/problem'
import type { EventSummary } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { formatEventTime } from '../../shared/format/time'
import { PosterArt } from '../../shared/ui/PosterArt'
import { PAGE_SIZE, useEvent, useEvents } from './api'
import { EventCard, SaleBadge } from './EventCard'
import { saleStatus } from './format'

const SEARCH_DELAY_MS = 300
/** Gợi ý tìm nhanh: API tìm theo cả tên thành phố. */
const CITY_SUGGESTIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']
/** Danh sách ngắn hơn thế này thì không tách khối nổi bật: lưới chỉ còn vài thẻ trông trống. */
const FEATURED_MIN_EVENTS = 4

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
  const items = events.data?.items ?? []
  const pageCount = events.data ? Math.max(1, Math.ceil(events.data.total / PAGE_SIZE)) : 1

  // Trang đầu, không tìm kiếm: sự kiện đang mở bán đầu tiên lên khối nổi bật, lưới bỏ nó ra để khỏi lặp
  const featured =
    !q && page === 1 && items.length >= FEATURED_MIN_EVENTS
      ? items.find((event) => saleStatus(event).kind === 'onSale')
      : undefined
  const gridItems = featured ? items.filter((event) => event.id !== featured.id) : items

  const goToPage = (next: number) => {
    const nextParams = new URLSearchParams(params)
    if (next > 1) nextParams.set('page', String(next))
    else nextParams.delete('page')
    setParams(nextParams)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      {/* Khối đầu trang màu than, liền với thanh điều hướng; lưới kẻ mờ và cụm poster bên phải */}
      <section className="relative isolate overflow-hidden bg-night text-white">
        <div className="pattern-grid absolute inset-0 -z-10 text-white/[0.07]" aria-hidden />
        <Container size="xl" className="relative py-14 md:py-20">
          <PosterCollage events={items.slice(0, 3)} />
          <div className="max-w-xl">
            <Text size="sm" weight="semibold" className="text-white/60">
              Concert · Kịch · Hài độc thoại · Lễ hội
            </Text>
            <h1 className="mt-3 text-5xl font-bold leading-[1.04] tracking-tight md:text-6xl">Tối nay đi đâu?</h1>
            <Text size="lg" className="mt-4 text-white/70">
              Chọn ghế, thanh toán và nhận vé QR qua email chỉ trong vài phút.
            </Text>
            <Input
              type="search"
              size="lg"
              aria-label="Tìm sự kiện"
              placeholder="Tên sự kiện, địa điểm hoặc thành phố… (gõ không dấu cũng được)"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              leftSection={<Search className="size-4" aria-hidden />}
              wrapperClassName="mt-8 border-transparent bg-card text-foreground shadow-sm"
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="me-1 text-sm text-white/60">Gợi ý:</span>
              {CITY_SUGGESTIONS.map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                  onClick={() => setDraft(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container size="xl" className="py-12">
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

        {events.data && items.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card/60 py-16 text-center">
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

        {events.data && items.length > 0 && (
          <>
            {featured && <FeaturedEvent event={featured} />}
            <section aria-labelledby="all-events-heading" className={featured ? 'mt-14' : undefined}>
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="all-events-heading" className="text-xl font-bold">
                  {q ? `Kết quả cho "${q}"` : 'Tất cả sự kiện'}
                </h2>
                <Text size="sm" tone="muted">
                  {events.data.total} sự kiện
                </Text>
              </div>
              <Grid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={6} aria-busy={events.isFetching}>
                {gridItems.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </Grid>
              {pageCount > 1 && (
                <Pagination
                  className="mt-10 justify-center"
                  pageCount={pageCount}
                  page={page}
                  onPageChange={goToPage}
                />
              )}
            </section>
          </>
        )}
      </Container>
    </>
  )
}

/** Ba poster xếp nghiêng bên phải khối đầu trang, lấy từ các sự kiện đang hiện. Chỉ để trang trí. */
function PosterCollage({ events }: { events: EventSummary[] }) {
  const [front, left, right] = events
  const shadow = 'rounded-xl shadow-[0_28px_56px_-24px_rgb(0_0_0/0.75)]'
  return (
    <div aria-hidden className="absolute right-8 top-1/2 hidden h-[340px] w-[420px] -translate-y-1/2 lg:block">
      {left && (
        <PosterArt
          seed={left.id}
          title={left.title}
          startsAt={left.startsAt}
          timeZone={left.timeZone}
          city={left.city}
          className={cn('absolute left-0 top-[54px] z-10 h-[240px] w-[190px] -rotate-[7deg]', shadow)}
        />
      )}
      {right && (
        <PosterArt
          seed={right.id}
          title={right.title}
          startsAt={right.startsAt}
          timeZone={right.timeZone}
          city={right.city}
          className={cn('absolute left-[222px] top-[14px] z-20 h-[240px] w-[190px] rotate-[6deg]', shadow)}
        />
      )}
      {front && (
        <PosterArt
          seed={front.id}
          title={front.title}
          startsAt={front.startsAt}
          timeZone={front.timeZone}
          city={front.city}
          className={cn('absolute left-[104px] top-[72px] z-30 h-[262px] w-[212px] -rotate-[1.5deg]', shadow)}
        />
      )}
    </div>
  )
}

/**
 * Khối nổi bật: sự kiện đang mở bán gần nhất. API danh sách không có mô tả và giá, nên tải thêm chi tiết của riêng sự
 * kiện này (cùng cache với trang chi tiết); chưa tải xong hoặc lỗi thì khối vẫn hiện, chỉ thiếu hai dòng đó.
 */
function FeaturedEvent({ event }: { event: EventSummary }) {
  const detail = useEvent(event.id)
  const prices = detail.data?.ticketTypes.map((t) => t.price) ?? []
  const minPrice = prices.length > 0 ? Math.min(...prices) : null

  return (
    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="text-xl font-bold">
        Gần nhất đang mở bán
      </h2>
      <article className="mt-5 flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs md:flex-row">
        <PosterArt
          variant="hero"
          seed={event.id}
          title={event.title}
          startsAt={event.startsAt}
          timeZone={event.timeZone}
          city={event.city}
          className="min-h-72 md:min-h-[22rem] md:w-1/2"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center p-6 md:p-10">
          <SaleBadge sale={saleStatus(event)} timeZone={event.timeZone} className="self-start" />
          <h3 className="mt-3 text-3xl font-bold leading-tight tracking-tight">{event.title}</h3>
          {detail.data?.description && (
            <p className="mt-3 line-clamp-3 max-w-prose leading-relaxed text-foreground/80">{detail.data.description}</p>
          )}
          <ul className="mt-5 flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2.5">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {formatEventTime(event.startsAt, event.timeZone)}
            </li>
            <li className="flex min-w-0 items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">
                {event.venueName} · {event.city}
              </span>
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
            {minPrice !== null && (
              <div>
                <Text size="sm" tone="muted">
                  Giá vé từ
                </Text>
                <div className="text-2xl font-bold tabular-nums">{formatVnd(minPrice)}</div>
              </div>
            )}
            <Button asChild size="lg" rightIcon={<ArrowRight className="size-4" />} className="ms-auto">
              <Link to={`/events/${event.id}`}>Xem và chọn vé</Link>
            </Button>
          </div>
        </div>
      </article>
    </section>
  )
}

function EventGridSkeleton() {
  return (
    <Grid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={6} aria-label="Đang tải">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
      ))}
    </Grid>
  )
}
