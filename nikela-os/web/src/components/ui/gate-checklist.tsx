import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { GateCheck } from '@/lib/economics'

interface GateChecklistProps {
  checks: readonly GateCheck[]
  className?: string
}

/**
 * Renders the five route release gates.
 *
 * Failing checks are always shown with their reason: an operator must be able
 * to see why a route is held rather than being offered an override button.
 */
export function GateChecklist({ checks, className }: GateChecklistProps) {
  return (
    <ul className={cn('space-y-2', className)}>
      {checks.map((check) => (
        <li key={check.id} className="flex items-start gap-2.5">
          {check.passed ? (
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-500" />
          ) : (
            <XCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger-500" />
          )}
          <div className="min-w-0">
            <p
              className={cn(
                'text-[13px] font-medium leading-snug',
                check.passed ? 'text-ink-900' : 'text-danger-500'
              )}
            >
              {check.label}
            </p>
            <p className="text-[11.5px] leading-snug text-ink-500">{check.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
