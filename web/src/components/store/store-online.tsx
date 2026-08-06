'use client'

import { Minus, PackageCheck, Plus, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { MoneyLine } from '@/components/ui/money-line'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatTile } from '@/components/ui/stat-tile'
import { cn } from '@/lib/cn'
import { catalogue } from '@/lib/data/catalogue'
import { currentCycle } from '@/lib/data/cycles'
import { findHub, findZone } from '@/lib/data/network'
import { allocateSaving, type SavingAllocation } from '@/lib/economics'
import { logger } from '@/lib/logger'
import { formatCents, formatPercent, formatRand } from '@/lib/money'
import { buildQuote } from '@/lib/quote'

const INITIAL_BASKET: Record<string, number> = {
  sku_maize_10kg: 1,
  sku_oil_2l: 2,
  sku_sugar_2kg: 1,
}

interface AllocationPreset {
  id: string
  label: string
  description: string
  allocation: SavingAllocation
}

/** Default split: affordability first, which is the safest default for a member. */
const FALLBACK_ALLOCATION: SavingAllocation = {
  immediateDiscount: 100,
  personalSavings: 0,
  emergencyBuffer: 0,
  communityInvestment: 0,
}

const DEFAULT_PRESET_ID = 'balanced'

const presets: AllocationPreset[] = [
  {
    id: 'affordability',
    label: 'Lower this basket',
    description: 'Take the whole saving off today’s price.',
    allocation: FALLBACK_ALLOCATION,
  },
  {
    id: DEFAULT_PRESET_ID,
    label: 'Split it',
    description: 'Half off today, half into personal savings.',
    allocation: {
      immediateDiscount: 50,
      personalSavings: 50,
      emergencyBuffer: 0,
      communityInvestment: 0,
    },
  },
  {
    id: 'stokvel',
    label: 'Build stokvel value',
    description: 'Keep some savings and contribute to the group funds.',
    allocation: {
      immediateDiscount: 40,
      personalSavings: 30,
      emergencyBuffer: 20,
      communityInvestment: 10,
    },
  },
]

/**
 * StoreOnline household surface.
 *
 * A member builds a basket against the open group cycle, sees the tier that
 * pooled volume has unlocked, and chooses where their verified saving goes.
 * Group buckets are only ever funded from a split the member picks.
 */
export function StoreOnline() {
  const [basket, setBasket] = useState<Record<string, number>>(INITIAL_BASKET)
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID)
  const [collected, setCollected] = useState(false)

  const quote = useMemo(
    () =>
      buildQuote(
        Object.entries(basket)
          .filter(([, units]) => units > 0)
          .map(([skuId, units]) => ({ skuId, units, supplierId: 'sup_boxer_bulk' }))
      ),
    [basket]
  )

  const preset = presets.find((candidate) => candidate.id === presetId)
  const allocated = allocateSaving(
    quote.savingTotalCents,
    preset?.allocation ?? FALLBACK_ALLOCATION
  )
  const payableNow = quote.landedTotalCents - allocated.immediateDiscountCents

  const zone = findZone(currentCycle.zoneId)
  const hub = findHub(currentCycle.hubId)

  function adjust(skuId: string, delta: number) {
    setBasket((current) => {
      const next = Math.max((current[skuId] ?? 0) + delta, 0)
      return { ...current, [skuId]: next }
    })
  }

  function handleCollect() {
    setCollected(true)
    logger.info('Collection PIN verified at hub', {
      hubId: currentCycle.hubId,
      savingCents: quote.savingTotalCents,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Group cycle"
          value={currentCycle.status === 'open' ? 'Open' : currentCycle.status}
          hint={`Locks ${currentCycle.locksAt}`}
        />
        <StatTile
          label="Households in"
          value={`${currentCycle.participatingHouseholds}`}
          hint={`+ ${currentCycle.participatingShops} shops pooling volume`}
        />
        <StatTile
          label="Your basket"
          value={formatRand(payableNow)}
          hint="After immediate discount"
        />
        <StatTile
          label="Your verified saving"
          value={formatRand(quote.savingTotalCents)}
          hint={`${formatPercent(quote.savingRatio)} vs walk-in retail`}
          tone={quote.savingTotalCents >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader
            eyebrow="Open cycle basket"
            title={currentCycle.groupName}
            description="Ambient staples only. Prices shown are the tier pooled volume has already unlocked."
            action={<Badge tone="brand">{zone?.name}</Badge>}
          />
          <CardBody className="space-y-2">
            {catalogue.map((sku) => {
              const units = basket[sku.id] ?? 0
              const line = quote.lines.find((candidate) => candidate.skuId === sku.id)
              return (
                <div
                  key={sku.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                    units > 0 ? 'border-brand-200 bg-brand-50/40' : 'border-ink-100'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink-900">
                      {sku.name} <span className="text-ink-500">{sku.packSize}</span>
                    </p>
                    <p className="tabular truncate text-[11.5px] text-ink-500">
                      {line
                        ? `${formatCents(line.appliedUnitPriceCents)} each · retail ${formatCents(sku.comparator.unitPriceCents)}`
                        : `Retail comparator ${formatCents(sku.comparator.unitPriceCents)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Remove one ${sku.name}`}
                      onClick={() => adjust(sku.id, -1)}
                      disabled={units === 0}
                    >
                      <Minus aria-hidden className="size-3.5" />
                    </Button>
                    <span className="tabular w-6 text-center text-[13px] font-semibold text-ink-900">
                      {units}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Add one ${sku.name}`}
                      onClick={() => adjust(sku.id, 1)}
                    >
                      <Plus aria-hidden className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardBody>
          <CardFooter>
            <div className="space-y-0.5">
              <MoneyLine
                label="Retail comparator basket"
                amountCents={quote.comparatorTotalCents}
              />
              <MoneyLine
                label="Supplier price at pooled tier"
                amountCents={quote.supplierTotalCents}
              />
              <MoneyLine label="Logistics fee" amountCents={quote.logisticsTotalCents} />
              <MoneyLine
                label="Hub handling fee"
                amountCents={quote.hubTotalCents}
                note="Only on verified handover"
              />
              <MoneyLine label="Platform coordination fee" amountCents={quote.platformTotalCents} />
              <MoneyLine
                label="Verified saving after all fees"
                amountCents={quote.savingTotalCents}
                emphasis="total"
                showSign
              />
            </div>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              eyebrow="Your choice"
              title="Where your saving goes"
              description="Emergency and community funds are only funded when you choose to, under the group's documented rules."
            />
            <CardBody className="space-y-2">
              {presets.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
                    presetId === option.id
                      ? 'border-brand-300 bg-brand-50/50'
                      : 'border-ink-100 hover:bg-surface'
                  )}
                >
                  <input
                    type="radio"
                    name="allocation"
                    value={option.id}
                    checked={presetId === option.id}
                    onChange={() => setPresetId(option.id)}
                    className="mt-0.5 accent-brand-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink-900">
                      {option.label}
                    </span>
                    <span className="block text-[11.5px] leading-snug text-ink-500">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}

              <div className="mt-1 space-y-0.5 rounded-xl bg-surface px-3 py-2.5">
                <MoneyLine
                  label="Off today's basket"
                  amountCents={allocated.immediateDiscountCents}
                />
                <MoneyLine
                  label="Personal savings credit"
                  amountCents={allocated.personalSavingsCents}
                />
                <MoneyLine
                  label="Group emergency buffer"
                  amountCents={allocated.emergencyBufferCents}
                  note={
                    allocated.emergencyBufferCents > 0
                      ? 'Voluntary, quorum required to withdraw'
                      : undefined
                  }
                />
                <MoneyLine
                  label="Community investment fund"
                  amountCents={allocated.communityInvestmentCents}
                />
                <MoneyLine label="You pay now" amountCents={payableNow} emphasis="total" />
              </div>
              <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-300">
                <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                Allocations are recorded by Nikela; the money itself is held by a licensed partner.
                Nikela is not a bank and never holds your funds.
              </p>
            </CardBody>
          </Card>

          <Card className={collected ? 'border-brand-200' : undefined}>
            <CardHeader
              eyebrow="Collection"
              title={hub?.name ?? 'Hub collection'}
              description={`${zone?.serviceWindow ?? 'Scheduled window'} · hub collection is the default tier in this zone.`}
              action={
                <Badge tone={collected ? 'brand' : 'ochre'}>
                  {collected ? 'Handover verified' : 'Awaiting collection'}
                </Badge>
              }
            />
            <CardBody className="space-y-3">
              {collected ? (
                <div className="flex items-start gap-2.5 rounded-xl bg-brand-50/60 p-3">
                  <PackageCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <div>
                    <p className="text-[13px] font-medium text-ink-900">
                      Collected and reconciling
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
                      The hub fee is now payable and your saving posts to the ledger once the
                      supplier invoice is final. Your statement will show every fee behind this
                      basket.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-dashed border-ink-100 px-3 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                      Single-use collection PIN
                    </p>
                    <p className="tabular mt-1 text-2xl font-semibold tracking-[0.3em] text-ink-900">
                      4192
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-500">
                      Sent by WhatsApp with SMS fallback. Never shown to the hub operator.
                    </p>
                  </div>
                  <Button onClick={handleCollect}>Simulate verified handover</Button>
                </>
              )}
              {zone && !zone.doorstepEnabled ? (
                <p className="text-[11.5px] leading-snug text-ink-300">
                  Doorstep delivery is not enabled in {zone.name} yet: it unlocks only when handover
                  density in a micro-zone clears the doorstep cost floor.
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          eyebrow="Tier progress"
          title="What the group unlocked together"
          description="Each line shows the pooled units behind your price and what the next tier needs."
        />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quote.lines.map((line) => (
            <div key={line.skuId} className="rounded-xl border border-ink-100 p-3">
              <p className="text-[13px] font-medium text-ink-900">
                {line.sku.name} <span className="text-ink-500">{line.sku.packSize}</span>
              </p>
              <p className="tabular mt-0.5 text-[11.5px] text-ink-500">
                {line.pooledUnits} pooled units · {formatCents(line.appliedUnitPriceCents)} per unit
              </p>
              <div className="mt-2">
                <ProgressBar
                  ratio={
                    line.nextTier
                      ? line.pooledUnits / (line.pooledUnits + line.nextTier.unitsNeeded)
                      : 1
                  }
                  tone={line.nextTier ? 'ochre' : 'brand'}
                  label={`${line.sku.name} tier progress`}
                />
              </div>
              <p className="mt-1.5 text-[11.5px] text-ink-500">
                {line.nextTier
                  ? `${line.nextTier.unitsNeeded} more units → ${formatCents(line.nextTier.unitPriceCents)} each`
                  : 'Best tier reached'}
              </p>
            </div>
          ))}
          {quote.lines.length === 0 ? (
            <p className="text-[13px] text-ink-500">Add items to see the pooled tier progress.</p>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
