import { ArrowRight, ShieldCheck, TrendingDown, Users } from 'lucide-react'
import Link from 'next/link'
import { surfaces } from '@/components/surfaces'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { StatTile } from '@/components/ui/stat-tile'
import { currentCycle } from '@/lib/data/cycles'
import { formatRand } from '@/lib/money'

const principles = [
  {
    icon: TrendingDown,
    title: 'Density before delivery',
    body: 'Hub collection is the default tier. A route is only released when prepaid orders clear its cost floor per successful handover.',
  },
  {
    icon: Users,
    title: 'Rewards follow verified work',
    body: 'Every payout keys off a scanned receipt, a PIN-verified handover or a reconciled order. Referrals are capped at a single tier.',
  },
  {
    icon: ShieldCheck,
    title: 'Non-custodial by construction',
    body: 'Nikela records allocations; licensed partners hold the funds. Every balance names its custodian.',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-brand-100 bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-7 text-white sm:px-8 sm:py-10">
        <Badge tone="ochre" className="bg-white/15 text-ochre-100 ring-white/20">
          Community commerce operating system
        </Badge>
        <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">
          Spazas and households buy together. Trusted neighbours move the goods. Savings stay in the
          community.
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-brand-50">
          Nikela-OS aggregates household and spaza demand into consolidated procurement, coordinates
          fulfilment through verified local hubs and runners, and converts every verified saving
          into transparent personal or stokvel value.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/procure"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-[13.5px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Open procurement <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link
            href="/ops"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-600/60 px-4 text-[13.5px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-brand-600"
          >
            Open ops console
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Open cycle"
          value={currentCycle.groupName.split(' ').slice(0, 2).join(' ')}
          hint={`Locks ${currentCycle.locksAt}`}
        />
        <StatTile
          label="Committed value"
          value={formatRand(currentCycle.committedValueCents)}
          hint={`${currentCycle.participatingHouseholds} households, ${currentCycle.participatingShops} shops`}
          tone="positive"
        />
        <StatTile label="Zones live" value="3" hint="Khayelitsha, Umlazi, Orlando East" />
        <StatTile
          label="Default service tier"
          value="Hub collection"
          hint="Doorstep is earned per zone by handover history"
        />
      </div>

      <Card>
        <CardHeader
          title="Choose a surface"
          description="Each audience gets its own view over one backend and one canonical order identity."
        />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map((surface) => (
            <Link
              key={surface.href}
              href={surface.href}
              className="group flex flex-col rounded-xl border border-ink-100 bg-canvas p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <surface.icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink-900">
                    {surface.label}
                  </p>
                  <p className="truncate text-[11.5px] text-ink-300">{surface.audience}</p>
                </div>
              </div>
              <p className="mt-2.5 flex-1 text-[12.5px] leading-relaxed text-ink-500">
                {surface.summary}
              </p>
              <p className="mt-2.5 flex items-center gap-1 text-[11.5px] font-medium text-brand-600">
                {surface.channel}
                <ArrowRight
                  aria-hidden
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                />
              </p>
            </Link>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {principles.map((principle) => (
          <Card key={principle.title}>
            <CardBody>
              <span className="grid size-8 place-items-center rounded-lg bg-ochre-50 text-ochre-600">
                <principle.icon aria-hidden className="size-4" />
              </span>
              <h3 className="mt-2.5 text-[13.5px] font-semibold text-ink-900">{principle.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{principle.body}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="What this build is"
          description="A working front end over the platform's real economics engine, using representative pilot data."
        />
        <CardBody className="space-y-2 text-[13px] leading-relaxed text-ink-500">
          <p>
            Landed costs, savings splits, route gates and payout stacks are computed by the shared
            economics module, not hard-coded into screens. Every screen that shows a price shows the
            fee components behind it.
          </p>
          <p>
            Data is representative pilot data for Khayelitsha, Umlazi and Orlando East. No live
            supplier feeds, payment rails or personal information are connected.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
