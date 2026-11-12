import { cn } from 'momi-ui'

import { eventDateParts } from '../format/time'

/**
 * Bộ màu poster sự kiện (BE chưa có ảnh): nền phẳng rực, một hoạ tiết in (vòng tròn, sọc chéo, sọc ngang) màu cùng
 * tông với chữ, chọn ổn định theo id để lần nào mở cũng giống nhau. `chip` là ô ngày ngược màu với nền.
 * Viết nguyên văn để Tailwind sinh class.
 */
const PALETTES = [
  { surface: 'bg-poster-coral text-poster-ink', pattern: 'pattern-rings text-poster-ink/15', chip: 'bg-poster-ink text-poster-paper' },
  { surface: 'bg-poster-violet text-white', pattern: 'pattern-rings text-white/15', chip: 'bg-white text-poster-ink' },
  { surface: 'bg-poster-cyan text-poster-ink', pattern: 'pattern-stripes text-poster-ink/15', chip: 'bg-poster-ink text-poster-paper' },
  { surface: 'bg-poster-blue text-white', pattern: 'pattern-bands text-white/15', chip: 'bg-white text-poster-ink' },
  { surface: 'bg-poster-amber text-poster-ink', pattern: 'pattern-stripes text-poster-ink/15', chip: 'bg-poster-ink text-poster-paper' },
  { surface: 'bg-poster-pink text-poster-ink', pattern: 'pattern-rings text-poster-ink/15', chip: 'bg-poster-ink text-poster-paper' },
  { surface: 'bg-poster-mint text-poster-ink', pattern: 'pattern-bands text-poster-ink/15', chip: 'bg-poster-ink text-poster-paper' },
  { surface: 'bg-poster-ink text-poster-paper', pattern: 'pattern-rings text-brand/25', chip: 'bg-brand text-brand-foreground' },
] as const

export type PosterPalette = (typeof PALETTES)[number]

/** Vị trí mảng hoạ tiết: góc trên phải, góc dưới trái, nửa dưới. */
const PATTERN_PLACES = [
  'right-[-35%] top-[-35%] size-[110%] rounded-full',
  'left-[-30%] bottom-[-40%] size-[100%] rounded-full',
  'inset-x-0 bottom-0 h-1/2',
] as const

export function posterIndex(seed: string, length: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % length
}

/** Màu poster của một sự kiện: dùng cho poster, ô nổi bật và khối đầu trang chi tiết. */
export function posterPalette(seed: string): PosterPalette {
  return PALETTES[posterIndex(seed, PALETTES.length)]!
}

/** Lớp hoạ tiết đặt sau nội dung (cha cần `relative isolate overflow-hidden`). */
export function PosterPattern({ seed, className }: { seed: string; className?: string }) {
  const place = PATTERN_PLACES[posterIndex(seed + 'shape', PATTERN_PLACES.length)]!
  return <div aria-hidden className={cn('absolute -z-10', posterPalette(seed).pattern, place, className)} />
}

interface PosterArtProps {
  seed: string
  title: string
  startsAt: string
  timeZone: string
  city?: string
  /**
   * `card`: ô ngày góc dưới, giờ và thành phố bên phải (tên sự kiện nằm ngoài poster). `hero`: thêm tên sự kiện chữ
   * lớn. `mini`: ô vuông nhỏ chỉ có ngày diễn (danh sách đơn, vé).
   */
  variant?: 'card' | 'hero' | 'mini'
  className?: string
}

export function PosterArt({ seed, title, startsAt, timeZone, city, variant = 'card', className }: PosterArtProps) {
  const palette = posterPalette(seed)
  const date = eventDateParts(startsAt, timeZone)

  if (variant === 'mini') {
    return (
      <div
        aria-hidden
        data-slot="poster"
        className={cn('relative isolate grid place-items-center overflow-hidden', palette.surface, className)}
      >
        <PosterPattern seed={seed} />
        <div className="text-center leading-none">
          <div className="font-display text-2xl font-bold tracking-tighter">{date.day}</div>
          <div className="mt-1 text-[0.6rem] font-bold tracking-[0.14em]">{date.month}</div>
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div
        aria-hidden
        data-slot="poster"
        className={cn('relative isolate flex flex-col justify-between overflow-hidden p-6 md:p-7', palette.surface, className)}
      >
        <PosterPattern seed={seed} />
        <div className="flex items-start justify-between gap-4">
          <DateChip day={date.day} month={date.month} chip={palette.chip} />
          <div className="text-right text-xs font-bold uppercase tracking-[0.14em]">
            <div>{date.time}</div>
            {city && <div className="mt-1.5">{city}</div>}
          </div>
        </div>
        <div className="line-clamp-3 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tighter text-balance lg:text-4xl">
          {title}
        </div>
      </div>
    )
  }

  return (
    <div
      aria-hidden
      data-slot="poster"
      className={cn('relative isolate flex items-end justify-between gap-3 overflow-hidden p-4', palette.surface, className)}
    >
      <PosterPattern seed={seed} />
      <DateChip day={date.day} month={date.month} chip={palette.chip} />
      <div className="text-right text-[0.68rem] font-bold uppercase leading-none tracking-[0.14em]">
        <div>{date.time}</div>
        {city && <div className="mt-1.5">{city}</div>}
      </div>
    </div>
  )
}

/** Ô ngày ngược màu với nền poster: số ngày chữ lớn, tháng chữ nhỏ. */
export function DateChip({ day, month, chip, className }: { day: string; month: string; chip: string; className?: string }) {
  return (
    <span className={cn('inline-flex flex-col items-center rounded-md px-3 py-2 leading-none', chip, className)}>
      <span className="font-display text-2xl font-bold tracking-tighter">{day}</span>
      <span className="mt-1 text-[0.62rem] font-bold tracking-[0.14em]">{month}</span>
    </span>
  )
}
