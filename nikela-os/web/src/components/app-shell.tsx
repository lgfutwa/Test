'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { surfaces } from './surfaces'

/** Wordmark rendered as inline SVG to avoid a webfont or image request. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-md bg-brand-500 text-[13px] font-bold text-white"
      >
        N
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink-900">
        Nikela<span className="text-brand-500">-OS</span>
      </span>
    </span>
  )
}

interface AppShellProps {
  children: ReactNode
}

/**
 * Application chrome: a persistent surface switcher.
 *
 * A real deployment shows one surface per audience; this navigation exists so
 * the whole operating system can be reviewed in one place.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="rounded focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <Wordmark />
          </Link>
          <nav aria-label="Surfaces" className="hidden md:block">
            <ul className="flex items-center gap-0.5">
              {surfaces.map((surface) => {
                const active = pathname === surface.href
                return (
                  <li key={surface.href}>
                    <Link
                      href={surface.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-500 hover:bg-surface hover:text-ink-900'
                      )}
                    >
                      <surface.icon aria-hidden className="size-3.5" />
                      {surface.shortLabel}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-10">
        {children}
      </main>

      <nav
        aria-label="Surfaces"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-canvas/95 backdrop-blur md:hidden"
      >
        <ul className="flex items-stretch justify-between px-1 py-1">
          {surfaces.slice(0, 6).map((surface) => {
            const active = pathname === surface.href
            return (
              <li key={surface.href} className="flex-1">
                <Link
                  href={surface.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10.5px] font-medium',
                    active ? 'text-brand-600' : 'text-ink-300'
                  )}
                >
                  <surface.icon aria-hidden className="size-4" />
                  <span className="truncate">{surface.shortLabel}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
