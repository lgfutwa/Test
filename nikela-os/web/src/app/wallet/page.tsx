import { Landmark, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { LedgerDrilldown } from '@/components/wallet/ledger-drilldown'
import { memberBuckets } from '@/lib/data/ledger'
import { formatCents, formatRand } from '@/lib/money'

export const metadata = {
  title: 'Wallet and savings ledger — non-custodial allocations',
}

export default function WalletPage() {
  const total = memberBuckets.reduce((sum, bucket) => sum + bucket.balanceCents, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Wallet and savings ledger"
        title="Nikela records the allocation. A licensed partner holds the money."
        description="Every bucket names its custodian and its withdrawal rule. Each balance drills down to the journal entries behind it, and each entry names the verified event that justified it."
        meta={[
          { label: 'Non-custodial by construction', tone: 'brand' },
          { label: 'Double-entry, append-only' },
          { label: 'Group buckets follow documented rules' },
        ]}
      />

      <Card className="border-brand-200 bg-brand-50/40">
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
              Total allocated across buckets
            </p>
            <p className="tabular mt-1 text-3xl font-semibold text-ink-900">{formatRand(total)}</p>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-ink-500">
              This is an allocation record, not a deposit balance. Nikela is not a bank and never
              holds member funds. Cash-out and apply-to-basket requests settle on the partner's
              rails.
            </p>
          </div>
          <Badge tone="brand">
            <ShieldCheck aria-hidden className="size-3" />
            Custody held externally
          </Badge>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {memberBuckets.map((bucket) => (
          <Card key={bucket.bucket}>
            <CardHeader
              eyebrow={
                bucket.ownerKind === 'person'
                  ? 'Your allocation'
                  : bucket.ownerKind === 'group'
                    ? 'Group fund'
                    : 'Zone fund'
              }
              title={bucket.label}
              description={bucket.description}
            />
            <CardBody className="space-y-2.5">
              <p className="tabular text-2xl font-semibold text-ink-900">
                {formatCents(bucket.balanceCents)}
              </p>
              <p className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-500">
                <Landmark aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-300" />
                Held at: {bucket.custodian}
              </p>
              <p className="rounded-lg bg-surface px-2.5 py-2 text-[11.5px] leading-snug text-ink-500">
                {bucket.withdrawalRule}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <LedgerDrilldown />
    </div>
  )
}
