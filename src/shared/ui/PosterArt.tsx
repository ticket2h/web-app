import { cn } from 'momi-ui'

import { eventDateParts } from '../format/time'

/**
 * Poster tự vẽ cho sự kiện (BE chưa có ảnh): mỗi sự kiện một màu nền phẳng và một mảng tròn cùng tông, chọn ổn định
 * theo id để lần nào mở cũng giống nhau. Chữ trên poster chỉ để trang trí (aria-hidden): thông tin thật nằm ngoài.
 */
const PALETTES = [
  { surface: 'bg-poster-coral text-poster-paper', shape: 'bg-poster-coral-2', rule: 'border-poster-paper/50' },
  { surface: 'bg-poster-ink text-poster-paper', shape: 'bg-poster-ink-2', rule: 'border-poster-paper/40' },
  { surface: 'bg-poster-sand text-poster-umber', shape: 'bg-poster-sand-2', rule: 'border-poster-umber/35' },
  { surface: 'bg-poster-sage text-poster-umber', shape: 'bg-poster-sage-2', rule: 'border-poster-umber/35' },
  { surface: 'bg-poster-slate text-poster-paper', shape: 'bg-poster-slate-2', rule: 'border-poster-paper/40' },
  { surface: 'bg-poster-plum text-poster-paper', shape: 'bg-poster-plum-2', rule: 'border-poster-paper/40' },
  { surface: 'bg-poster-teal text-poster-paper', shape: 'bg-poster-teal-2', rule: 'border-poster-paper/40' },
  { surface: 'bg-poster-clay text-poster-umber', shape: 'bg-poster-clay-2', rule: 'border-poster-umber/35' },
] as const

const SHAPES = [
  'right-[-20%] top-[-28%] size-[82%]',
  'left-[-28%] bottom-[-45%] size-[95%]',
  'right-[-15%] bottom-[-52%] size-[100%]',
] as const

export function posterIndex(seed: string, length: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % length
}

interface PosterArtProps {
  seed: string
  title: string
  startsAt: string
  timeZone: string
  city?: string
  /**
   * `card`: ngày diễn góc dưới, giờ và thành phố bên phải (tên sự kiện nằm ngoài poster). `hero`: thêm đường xé và tên
   * sự kiện. `mini`: ô vuông nhỏ chỉ có ngày diễn (danh sách đơn, vé).
   */
  variant?: 'card' | 'hero' | 'mini'
  className?: string
}

export function PosterArt({ seed, title, startsAt, timeZone, city, variant = 'card', className }: PosterArtProps) {
  const palette = PALETTES[posterIndex(seed, PALETTES.length)]!
  const shape = SHAPES[posterIndex(seed + 'shape', SHAPES.length)]!
  const date = eventDateParts(startsAt, timeZone)
  const circle = <div className={cn('absolute -z-10 rounded-full', palette.shape, shape)} />

  if (variant === 'mini') {
    return (
      <div
        aria-hidden
        data-slot="poster"
        className={cn('relative isolate grid place-items-center overflow-hidden', palette.surface, className)}
      >
        {circle}
        <div className="text-center leading-none">
          <div className="text-2xl font-bold tracking-tight">{date.day}</div>
          <div className="mt-1 text-[0.6rem] font-semibold tracking-[0.16em]">{date.month}</div>
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div
        aria-hidden
        data-slot="poster"
        className={cn('relative isolate flex flex-col justify-between overflow-hidden p-6 md:p-8', palette.surface, className)}
      >
        {circle}
        <div className="flex items-start justify-between gap-4 leading-none">
          <div>
            <div className="text-7xl font-bold tracking-tighter md:text-8xl">{date.day}</div>
            <div className="mt-2 text-sm font-semibold tracking-[0.18em]">
              {date.month} · {date.year}
            </div>
          </div>
          <div className="text-right text-xs font-semibold uppercase tracking-[0.16em] md:text-sm">
            <div>{date.time}</div>
            {city && <div className="mt-1.5 opacity-85">{city}</div>}
          </div>
        </div>
        <div>
          <div className={cn('-mx-6 mb-5 border-t-2 border-dashed md:-mx-8', palette.rule)} />
          <div className="line-clamp-3 text-3xl font-bold uppercase leading-[0.98] tracking-tight text-balance lg:text-4xl">
            {title}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      aria-hidden
      data-slot="poster"
      className={cn('relative isolate flex items-end justify-between gap-3 overflow-hidden p-4 leading-none', palette.surface, className)}
    >
      {circle}
      <div>
        <div className="text-5xl font-bold tracking-tighter">{date.day}</div>
        <div className="mt-2 text-[0.68rem] font-semibold tracking-[0.16em]">{date.month}</div>
      </div>
      <div className="text-right text-[0.68rem] font-semibold uppercase tracking-[0.14em]">
        <div>{date.time}</div>
        {city && <div className="mt-1.5 opacity-85">{city}</div>}
      </div>
    </div>
  )
}
