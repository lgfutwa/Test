import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** Completion ratio; values above 1 are clamped for display. */
  ratio: number
  tone?: 'brand' | 'ochre' | 'danger'
  className?: string
  label?: string
}

const toneClasses = {
  brand: 'bg-brand-500',
  ochre: 'bg-ochre-400',
  danger: 'bg-danger-500',
}

/** Horizontal progress indicator for tier and density thresholds. */
export function ProgressBar({ ratio, tone = 'brand', className, label }: ProgressBarProps) {
  const percent = Math.min(Math.max(ratio, 0), 1) * 100
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', toneClasses[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
