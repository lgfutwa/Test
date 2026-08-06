'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-ink-300',
  secondary:
    'bg-canvas text-ink-900 ring-1 ring-ink-100 hover:bg-surface disabled:text-ink-300 disabled:ring-ink-100',
  ghost: 'bg-transparent text-brand-600 hover:bg-brand-50 disabled:text-ink-300',
  danger: 'bg-danger-500 text-white hover:bg-danger-500/90 disabled:bg-ink-300',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[12.5px]',
  md: 'h-10 px-4 text-[13.5px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  size?: Size
}

/** Primary interactive control. Touch targets stay at least 32px high. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
