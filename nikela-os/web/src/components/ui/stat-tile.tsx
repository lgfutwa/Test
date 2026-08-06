import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface StatTileProps {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'positive' | 'negative'
  icon?: ReactNode
  className?: string
}

const toneClasses = {
  neutral: 'text-ink-900',
  positive: 'text-brand-600',
  negative: 'text-danger-500',
}

/** Compact metric tile for cycle, route and savings summaries. */
export function StatTile({ label, value, hint, tone = 'neutral', icon, className }: StatTileProps) {
  return (
    <div className={cn('rounded-xl border border-ink-100 bg-canvas px-3.5 py-3', className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className={cn('tabular mt-1.5 text-xl font-semibold leading-none', toneClasses[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[12px] leading-snug text-ink-500">{hint}</p> : null}
    </div>
  )
}
