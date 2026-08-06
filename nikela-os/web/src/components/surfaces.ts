import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  LayoutDashboard,
  Route,
  ShoppingBasket,
  Store,
  Wallet,
  Warehouse,
} from 'lucide-react'

export interface SurfaceDefinition {
  href: string
  label: string
  shortLabel: string
  audience: string
  summary: string
  icon: LucideIcon
  /** Channel a real user of this surface would reach it through. */
  channel: string
}

/**
 * The surfaces of Nikela-OS.
 *
 * Order reflects the commercial sequence: spaza procurement is the wedge,
 * household buying follows, then fulfilment roles, then the ledger and the
 * internal control room.
 */
export const surfaces: SurfaceDefinition[] = [
  {
    href: '/procure',
    label: 'Nikela Procurement',
    shortLabel: 'Procure',
    audience: 'Spaza owners',
    summary:
      'Send a stock list, see the landed-cost comparison before confirming, and join the zone procurement cycle.',
    icon: Store,
    channel: 'WhatsApp-first, app after milestone',
  },
  {
    href: '/store',
    label: 'StoreOnline',
    shortLabel: 'Store',
    audience: 'Households and buying groups',
    summary:
      'Build a basket against the open group cycle, watch the price tier unlock, and choose where the verified saving goes.',
    icon: ShoppingBasket,
    channel: 'Low-data PWA with WhatsApp fallback',
  },
  {
    href: '/runner',
    label: 'Nikela Runners',
    shortLabel: 'Runner',
    audience: 'Community couriers',
    summary:
      'Declare a trip you are already making and see gated route offers with the full payout stack before accepting.',
    icon: Route,
    channel: 'Android app or guided WhatsApp flow',
  },
  {
    href: '/hub',
    label: 'Nikela Hubs',
    shortLabel: 'Hub',
    audience: 'Hub operators',
    summary:
      'Scan consolidated stock in, verify each handover with a single-use PIN, and reconcile exceptions.',
    icon: Warehouse,
    channel: 'Operator phone, camera scanning',
  },
  {
    href: '/wallet',
    label: 'Wallet and savings ledger',
    shortLabel: 'Wallet',
    audience: 'Members, groups and earners',
    summary:
      'Non-custodial allocation ledger: buckets, custodian disclosure, and drill-down to the source event behind every cent.',
    icon: Wallet,
    channel: 'PWA and app',
  },
  {
    href: '/ops',
    label: 'Ops console',
    shortLabel: 'Ops',
    audience: 'Nikela staff',
    summary:
      'Order desk, cycle lock, route gate evaluation and reconciliation — capable of running a pilot end to end by hand.',
    icon: LayoutDashboard,
    channel: 'Desktop web',
  },
  {
    href: '/compliance',
    label: 'Compliance desk',
    shortLabel: 'Compliance',
    audience: 'Compliance function',
    summary:
      'Consent registry, referral-reward audit, CPPI release gate and stokvel threshold monitoring.',
    icon: ClipboardList,
    channel: 'Desktop web',
  },
]
