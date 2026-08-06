import { cn } from '@/lib/cn'
import { formatCents } from '@/lib/money'

interface MoneyLineProps {
  label: string
  amountCents: number
  note?: string
  emphasis?: 'normal' | 'total' | 'muted'
  showSign?: boolean
}

/**
 * A single row of a fee breakdown or statement.
 *
 * Every fee the platform charges is rendered through this component so no
 * surface can quietly fold a fee into a product price.
 */
export function MoneyLine({
  label,
  amountCents,
  note,
  emphasis = 'normal',
  showSign = false,
}: MoneyLineProps) {
  const isTotal = emphasis === 'total'
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-1.5',
        isTotal && 'mt-1 border-t border-ink-100 pt-2.5'
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            'text-[13px] leading-snug',
            isTotal ? 'font-semibold text-ink-900' : 'text-ink-700',
            emphasis === 'muted' && 'text-ink-500'
          )}
        >
          {label}
        </p>
        {note ? <p className="mt-0.5 text-[11.5px] leading-snug text-ink-300">{note}</p> : null}
      </div>
      <p
        className={cn(
          'tabular shrink-0 text-[13px]',
          isTotal ? 'text-base font-semibold' : 'font-medium',
          amountCents < 0 ? 'text-ink-700' : isTotal ? 'text-brand-600' : 'text-ink-900'
        )}
      >
        {formatCents(amountCents, { showSign })}
      </p>
    </div>
  )
}
