import { Minus, Plus } from 'lucide-react'
import { IconButton } from 'momi-ui'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  label: string
  disabled?: boolean
}

/** Chọn số vé: nút trừ, số, nút cộng. */
export function QuantityStepper({ value, max, onChange, label, disabled }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <IconButton
        variant="outline"
        size="sm"
        aria-label={`Bớt một vé ${label}`}
        disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" />
      </IconButton>
      <output aria-live="polite" className="w-9 text-center font-display text-lg font-bold tabular-nums">
        {value}
      </output>
      <IconButton
        variant="outline"
        size="sm"
        aria-label={`Thêm một vé ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" />
      </IconButton>
    </div>
  )
}
