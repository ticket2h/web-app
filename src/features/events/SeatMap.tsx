import { cn, Text } from 'momi-ui'
import { useMemo } from 'react'

import type { Seat, TicketTypeView } from '../../shared/api/types'
import { formatVnd } from '../../shared/format/money'
import { groupSeats, seatLabel } from './checkout'

/** Màu ghế theo loại vé (thứ tự loại vé của sự kiện). Viết nguyên văn để Tailwind sinh class. */
const TYPE_STYLES = [
  { seat: 'border-poster-ultramarine/70 bg-poster-ultramarine/12 text-poster-ultramarine dark:text-poster-lilac dark:border-poster-lilac/60 dark:bg-poster-lilac/10', swatch: 'bg-poster-ultramarine dark:bg-poster-lilac' },
  { seat: 'border-poster-teal/70 bg-poster-teal/12 text-poster-teal dark:border-poster-teal dark:bg-poster-teal/20 dark:text-poster-paper', swatch: 'bg-poster-teal' },
  { seat: 'border-poster-ochre bg-poster-ochre/25 text-poster-ink dark:bg-poster-ochre/20 dark:text-poster-ochre', swatch: 'bg-poster-ochre' },
  { seat: 'border-poster-lilac bg-poster-lilac/25 text-poster-ink dark:bg-poster-lilac/15 dark:text-poster-lilac', swatch: 'bg-poster-lilac' },
] as const

interface SeatMapProps {
  seats: Seat[]
  ticketTypes: TicketTypeView[]
  selected: string[]
  onToggle: (seat: Seat) => void
  /** Đã chọn đủ số vé tối đa: ghế trống còn lại không bấm thêm được. */
  limitReached: boolean
  disabled?: boolean
  /** Chỉ xem (trang ban tổ chức): ghế trống giữ nguyên màu, không có chú thích "Đang chọn". */
  readOnly?: boolean
}

export function SeatMap({ seats, ticketTypes, selected, onToggle, limitReached, disabled, readOnly }: SeatMapProps) {
  const sections = useMemo(() => groupSeats(seats), [seats])
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const seatedTypes = ticketTypes.filter((t) => t.kind === 'SEATED')
  const typeIndex = new Map(seatedTypes.map((t, i) => [t.id, i % TYPE_STYLES.length]))
  const typeById = new Map(ticketTypes.map((t) => [t.id, t]))

  return (
    <div data-slot="seat-map">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {seatedTypes.map((type) => (
          <span key={type.id} className="flex items-center gap-2">
            <span className={cn('size-3.5 rounded-sm', TYPE_STYLES[typeIndex.get(type.id) ?? 0]!.swatch)} />
            {type.name} · {formatVnd(type.price)}
          </span>
        ))}
        {!readOnly && (
          <span className="flex items-center gap-2">
            <span className="size-3.5 rounded-sm bg-primary" /> Đang chọn
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="seat-taken size-3.5 rounded-sm bg-muted text-muted-foreground/50" /> Đã có người
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max min-w-full">
          <div className="mx-auto mb-8 max-w-md">
            <div className="h-2 rounded-t-full bg-foreground/80" />
            <Text size="xs" weight="semibold" align="center" tone="muted" className="mt-2 tracking-[0.4em]">
              SÂN KHẤU
            </Text>
          </div>

          <div className="flex flex-col gap-8">
            {sections.map((section) => (
              <section key={section.name} aria-label={`Khu ${section.name}`}>
                <Text size="xs" weight="semibold" align="center" className="mb-3 uppercase tracking-[0.2em]">
                  Khu {section.name}
                </Text>
                <div className="flex flex-col items-center gap-1.5">
                  {section.rows.map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-7 shrink-0 text-right font-mono text-xs text-muted-foreground">{row.label}</span>
                      <div className="flex gap-1.5">
                        {row.seats.map((seat) => {
                          const isSelected = selectedSet.has(seat.seatId)
                          const available = seat.status === 'AVAILABLE'
                          const blocked = readOnly || disabled || !available || (!isSelected && limitReached)
                          const type = typeById.get(seat.ticketTypeId)
                          const style = TYPE_STYLES[typeIndex.get(seat.ticketTypeId) ?? 0]!
                          return (
                            <button
                              key={seat.seatId}
                              type="button"
                              aria-pressed={isSelected}
                              disabled={blocked && !isSelected}
                              aria-label={`${seatLabel(seat)}, ${type?.name ?? ''}${
                                available ? `, ${formatVnd(type?.price ?? 0)}` : ', đã có người'
                              }`}
                              onClick={() => onToggle(seat)}
                              className={cn(
                                'grid size-7 place-items-center rounded-t-lg rounded-b-sm border font-mono text-[0.65rem] font-semibold transition-colors sm:size-8',
                                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                isSelected && 'border-primary bg-primary text-primary-foreground',
                                !isSelected && available && style.seat,
                                !isSelected && available && !blocked && 'hover:border-primary hover:bg-primary/15',
                                !available && 'seat-taken cursor-not-allowed border-transparent bg-muted text-muted-foreground/40',
                                available && blocked && !isSelected && !readOnly && 'cursor-not-allowed opacity-45',
                                readOnly && 'cursor-default',
                              )}
                            >
                              {seat.number}
                            </button>
                          )
                        })}
                      </div>
                      <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground">{row.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
