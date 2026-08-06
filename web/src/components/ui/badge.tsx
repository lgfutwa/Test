import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'ochre' | 'danger' | 'warn' | 'muted'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
  ochre: 'bg-ochre-50 text-ochre-600 ring-1 ring-ochre-100',
  danger: 'bg-danger-50 text-danger-500 ring-1 ring-danger-500/20',
  warn: 'bg-warn-50 text-warn-500 ring-1 ring-warn-500/20',
  muted: 'bg-surface text-ink-500 ring-1 ring-ink-100',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

/** Compact status pill. Tone carries meaning, never decoration alone. */
export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
