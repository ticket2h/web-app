import { cn } from 'momi-ui'

import { eventDateParts } from '../format/time'

/**
 * Poster tự vẽ cho sự kiện (BE chưa có ảnh): mỗi sự kiện một cặp màu, một hoạ tiết in và một mảng tròn, chọn ổn định
 * theo id để lần nào mở cũng giống nhau. Chữ trên poster chỉ để trang trí (aria-hidden): tiêu đề thật nằm ngoài.
 */
const PALETTES = [
  { surface: 'bg-poster-vermilion text-poster-paper', pattern: 'poster-dots text-poster-ink/25', shape: 'bg-poster-ochre' },
  { surface: 'bg-poster-ink text-poster-paper', pattern: 'poster-rings text-poster-vermilion/55', shape: 'bg-poster-vermilion' },
  { surface: 'bg-poster-ochre text-poster-ink', pattern: 'poster-stripes text-poster-ink/12', shape: 'bg-poster-vermilion' },
  { surface: 'bg-poster-teal text-poster-paper', pattern: 'poster-grid text-poster-paper/15', shape: 'bg-poster-ochre' },
  { surface: 'bg-poster-ultramarine text-poster-paper', pattern: 'poster-dots text-poster-lilac/35', shape: 'bg-poster-lilac' },
  { surface: 'bg-poster-lilac text-poster-ink', pattern: 'poster-rings text-poster-ink/18', shape: 'bg-poster-ultramarine' },
] as const

const SHAPES = [
  'right-[-18%] top-[-30%] size-[78%]',
  'left-[-22%] bottom-[-40%] size-[90%]',
  'right-[-10%] bottom-[-55%] size-[95%]',
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
  /** `mini`: ô vuông nhỏ chỉ có ngày diễn (danh sách đơn, vé). */
  variant?: 'card' | 'hero' | 'mini'
  className?: string
}

export function PosterArt({ seed, title, startsAt, timeZone, city, variant = 'card', className }: PosterArtProps) {
  const palette = PALETTES[posterIndex(seed, PALETTES.length)]!
  const shape = SHAPES[posterIndex(seed + 'shape', SHAPES.length)]!
  const date = eventDateParts(startsAt, timeZone)
  const hero = variant === 'hero'
  const background = (
    <>
      <div className={cn('absolute inset-0 -z-10', palette.pattern)} />
      <div className={cn('absolute -z-10 rounded-full opacity-90 mix-blend-multiply dark:mix-blend-normal', palette.shape, shape)} />
    </>
  )

  if (variant === 'mini') {
    return (
      <div
        aria-hidden
        data-slot="poster"
        className={cn('relative isolate grid place-items-center overflow-hidden', palette.surface, className)}
      >
        {background}
        <div className="text-center font-display leading-none">
          <div className="text-3xl font-extrabold tracking-tight">{date.day}</div>
          <div className="mt-1 text-[0.6rem] font-semibold tracking-[0.2em]">{date.month}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      aria-hidden
      data-slot="poster"
      className={cn('relative isolate overflow-hidden', palette.surface, className)}
    >
      {background}
      <div className={cn('flex h-full flex-col justify-between', hero ? 'p-6 md:p-10' : 'p-5')}>
        <div className="flex items-start justify-between gap-4">
          <div className="font-display leading-none">
            <div className={cn('font-extrabold tracking-tight', hero ? 'text-7xl md:text-8xl' : 'text-6xl')}>
              {date.day}
            </div>
            <div className={cn('mt-1 font-semibold tracking-[0.2em]', hero ? 'text-sm md:text-base' : 'text-xs')}>
              {date.month} · {date.year}
            </div>
          </div>
          <div className={cn('text-right font-semibold uppercase tracking-[0.18em]', hero ? 'text-xs md:text-sm' : 'text-[0.65rem]')}>
            <div>{date.time}</div>
            {city && <div className="mt-1 opacity-80">{city}</div>}
          </div>
        </div>
        <div
          className={cn(
            'font-display font-extrabold uppercase leading-[0.92] tracking-tight text-balance',
            hero ? 'line-clamp-4 text-4xl lg:text-5xl' : 'line-clamp-3 text-2xl',
          )}
        >
          {title}
        </div>
      </div>
    </div>
  )
}
