import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nikela-OS — community commerce operating system',
  description:
    'Community procurement and distribution operating system for South Africa: consolidated spaza and household buying, trusted local hubs, gated community delivery, and transparent savings.',
  applicationName: 'Nikela-OS',
}

export const viewport: Viewport = {
  themeColor: '#0b6e4f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
