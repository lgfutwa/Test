import type { ReactNode } from 'react'
import { Badge } from './ui/badge'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  meta?: Array<{ label: string; tone?: 'brand' | 'ochre' | 'muted' | 'warn' | 'danger' }>
  action?: ReactNode
}

/** Consistent surface heading with audience and operating context. */
export function PageHeader({ eyebrow, title, description, meta, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-500">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight text-ink-900 sm:text-2xl">
          {title}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{description}</p>
        {meta?.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {meta.map((item) => (
              <li key={item.label}>
                <Badge tone={item.tone ?? 'muted'}>{item.label}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
