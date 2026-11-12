import { Search } from 'lucide-react'
import { Alert, Button, cn, Container, Input, Pagination, Skeleton, Text } from 'momi-ui'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { errorMessage } from '../../shared/api/problem'
import type { EventSummary } from '../../shared/api/types'
import { eventDateParts } from '../../shared/format/time'
import { posterPalette, PosterPattern } from '../../shared/ui/PosterArt'
import { PAGE_SIZE, useEvents } from './api'
import { EventRow, EventTile } from './EventCard'
import { saleStatus } from './format'

const SEARCH_DELAY_MS = 300
/** Gợi ý tìm nhanh: API tìm theo cả tên thành phố. */
const CITY_SUGGESTIONS = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']
/** Ít sự kiện hơn thế này thì không tách lưới "Tâm điểm": lịch diễn bên dưới chỉ còn vài dòng trông trống. */
const SPOTLIGHT_MIN_EVENTS = 6
/** Kích thước từng ô của lưới "Tâm điểm": ô lớn 2×2, hai ô nhỏ, một ô ngang 2×1. */
const SPOTLIGHT_LAYOUT = [
  { size: 'lg', className: 'sm:col-span-2 lg:row-span-2' },
  { size: 'md', className: '' },
  { size: 'md', className: '' },
  { size: 'wide', className: 'sm:col-span-2' },
] as const

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

  // Trang đầu, không tìm kiếm, danh sách đủ dài: bốn sự kiện đầu lên lưới "Tâm điểm", phần còn lại thành lịch diễn
  const spotlight = !q && page === 1 && items.length >= SPOTLIGHT_MIN_EVENTS ? items.slice(0, 4) : []
  const rows = items.slice(spotlight.length)
  const ticketEvent = items.find((event) => saleStatus(event).kind === 'onSale') ?? items[0]

  const goToPage = (next: number) => {
    const nextParams = new URLSearchParams(params)
    if (next > 1) nextParams.set('page', String(next))
    else nextParams.delete('page')
    setParams(nextParams)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      {/* Khối đầu trang: tiêu đề chữ lớn, ô tìm kiếm, hình vé của sự kiện đang mở bán bên phải */}
      <section className="relative isolate overflow-hidden">
        <div className="pattern-dots absolute inset-0 -z-10 text-foreground/10" aria-hidden />
        <Container size="xl" className="flex items-center gap-12 pb-16 pt-10 md:pb-24 md:pt-16">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              Concert · Kịch · Hài độc thoại · Lễ hội
            </p>
            <h1 className="mt-6 text-5xl font-bold leading-[0.98] tracking-tighter sm:text-7xl lg:text-8xl">
              Tối nay
              <br />
              <span className="mt-2 inline-block -rotate-2 rounded-xl bg-brand px-4 pb-1.5 text-brand-foreground">đi đâu?</span>
            </h1>
            <Text size="lg" tone="muted" className="mt-7 max-w-lg leading-relaxed">
              Chọn ghế ngay trên sơ đồ, thanh toán và nhận vé QR qua email chỉ trong vài phút.
            </Text>
            <div className="mt-9 max-w-2xl rounded-2xl border bg-card p-1.5 shadow-[0_24px_48px_-32px_rgb(0_0_0/0.6)]">
              <Input
                type="search"
                size="lg"
                aria-label="Tìm sự kiện"
                placeholder="Tên sự kiện, địa điểm hoặc thành phố… (gõ không dấu cũng được)"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                leftSection={<Search className="size-5" aria-hidden />}
                wrapperClassName="h-14 border-transparent bg-transparent shadow-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="me-1 text-sm text-muted-foreground">Gợi ý:</span>
              {CITY_SUGGESTIONS.map((city) => (
                <Button key={city} variant="outline" size="sm" className="rounded-full" onClick={() => setDraft(city)}>
                  {city}
                </Button>
              ))}
            </div>
          </div>
          {ticketEvent && <HeroTicket event={ticketEvent} />}
        </Container>
      </section>

      {items.length >= 3 && <TitleMarquee titles={items.map((event) => event.title)} />}

      <Container size="xl" className="py-14 md:py-20">
        {events.isPending && <EventListSkeleton />}

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
          <div className="rounded-2xl border border-dashed py-16 text-center">
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

        {spotlight.length > 0 && (
          <section aria-labelledby="spotlight-heading" className="mb-20">
            <SectionHeading eyebrow="Sắp diễn ra gần nhất" id="spotlight-heading" title="Tâm điểm" />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:auto-rows-[260px] lg:grid-cols-4">
              {spotlight.map((event, index) => (
                <EventTile
                  key={event.id}
                  event={event}
                  size={SPOTLIGHT_LAYOUT[index]!.size}
                  className={SPOTLIGHT_LAYOUT[index]!.className}
                />
              ))}
            </div>
          </section>
        )}

        {events.data && rows.length > 0 && (
          <section aria-labelledby="schedule-heading">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <SectionHeading
                eyebrow="Lịch diễn"
                id="schedule-heading"
                title={q ? `Kết quả cho "${q}"` : spotlight.length > 0 ? 'Sắp diễn ra' : 'Tất cả sự kiện'}
              />
              <Text size="sm" tone="muted">
                {events.data.total} sự kiện
              </Text>
            </div>
            <ul className="mt-7 flex flex-col gap-2.5" aria-busy={events.isFetching}>
              {rows.map((event) => (
                <li key={event.id}>
                  <EventRow event={event} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {events.data && items.length > 0 && pageCount > 1 && (
          <Pagination className="mt-10 justify-center" pageCount={pageCount} page={page} onPageChange={goToPage} />
        )}
      </Container>
    </>
  )
}

function SectionHeading({ eyebrow, id, title }: { eyebrow: string; id: string; title: string }) {
  return (
    <div>
      <Text size="xs" weight="bold" tone="muted" className="tracking-[0.14em] uppercase">
        {eyebrow}
      </Text>
      <h2 id={id} className="mt-2 text-4xl font-bold leading-tight">
        {title}
      </h2>
    </div>
  )
}

/**
 * Hình vé bên phải khối đầu trang, vẽ từ một sự kiện đang mở bán: phần màu poster có tên và ngày, đường xé, cuống vé
 * có mã vạch. Chỉ để trang trí (aria-hidden); ẩn trên màn hình hẹp.
 */
function HeroTicket({ event }: { event: EventSummary }) {
  const palette = posterPalette(event.id)
  const date = eventDateParts(event.startsAt, event.timeZone)
  const onSale = saleStatus(event).kind === 'onSale'
  return (
    <div aria-hidden className="relative hidden h-[480px] w-[420px] shrink-0 lg:block">
      <div className="absolute left-16 top-10 h-[400px] w-[320px] rotate-6 rounded-2xl bg-secondary" />
      <div className="absolute left-6 top-11 w-[340px] -rotate-5 overflow-hidden rounded-2xl shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
        <div className={cn('relative isolate flex h-72 flex-col justify-between overflow-hidden p-6', palette.surface)}>
          <PosterPattern seed={event.id} />
          <div className="text-[0.7rem] font-bold tracking-[0.2em]">VÉ VÀO CỬA</div>
          <div>
            <div className="line-clamp-3 font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-tighter">
              {event.title}
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-xl font-bold">
                {date.day}.{date.month.replace('TH', '')}
              </span>
              <span className="truncate text-xs font-bold uppercase tracking-[0.12em]">
                {date.time} · {event.venueName}
              </span>
            </div>
          </div>
        </div>
        <div className="relative border-t-2 border-dashed border-black/25">
          <span className="absolute -left-3 -top-3 size-6 rounded-full bg-background" />
          <span className="absolute -right-3 -top-3 size-6 rounded-full bg-background" />
        </div>
        <div className="flex items-end justify-between gap-4 bg-poster-paper px-6 pb-5 pt-4 text-poster-ink">
          <div>
            <div className="text-[0.62rem] font-bold tracking-[0.16em] text-neutral-600">THÀNH PHỐ</div>
            <div className="font-display text-lg font-bold uppercase">{event.city}</div>
          </div>
          <div className="h-9 w-28 bg-[repeating-linear-gradient(90deg,#17171c_0_2px,transparent_2px_4px,#17171c_4px_7px,transparent_7px_9px,#17171c_9px_10px,transparent_10px_13px)]" />
        </div>
      </div>
      {onSale && (
        <div className="absolute right-2 top-0 grid size-28 rotate-12 place-items-center rounded-full bg-brand text-brand-foreground shadow-[0_16px_32px_-12px_rgb(0_0_0/0.7)]">
          <div className="absolute inset-2 rounded-full border-[1.5px] border-dashed border-black/40" />
          <div className="text-center font-display text-base font-extrabold leading-tight">
            ĐANG
            <br />
            MỞ BÁN
          </div>
        </div>
      )}
    </div>
  )
}

/** Dải chữ chạy tên các sự kiện, nền chanh, xoay nhẹ. Nội dung lặp hai lần để vòng chạy nối liền. */
function TitleMarquee({ titles }: { titles: string[] }) {
  const run = titles.flatMap((title) => [title, '✦'])
  return (
    <div aria-hidden className="overflow-hidden py-4">
      <div className="-mx-10 -rotate-[1.5deg] overflow-hidden bg-brand py-4 text-brand-foreground">
        <div className="marquee flex w-max gap-9 whitespace-nowrap font-display text-xl font-bold uppercase tracking-tight">
          {[...run, ...run].map((text, index) => (
            <span key={index}>{text}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EventListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-label="Đang tải">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  )
}
