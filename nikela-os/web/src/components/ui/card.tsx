import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

/** Surface container used for every panel across the platform. */
export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-card)] border border-ink-100 bg-canvas shadow-[0_1px_2px_rgba(13,26,21,0.04)]',
        className
      )}
    >
      {children}
    </section>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  eyebrow?: string
}

export function CardHeader({ title, description, action, eyebrow }: CardHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[15px] font-semibold leading-tight text-ink-900">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-4 py-4 sm:px-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <footer className={cn('border-t border-ink-100 bg-surface/60 px-4 py-3 sm:px-5', className)}>
      {children}
    </footer>
  )
}
