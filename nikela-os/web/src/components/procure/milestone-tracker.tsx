import { Check, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { shops } from '@/lib/data/network'
import { formatRand } from '@/lib/money'

const CYCLE_TARGET = 3
const SKU_TARGET = 30
const VOLUME_TARGET_CENTS = 5_000_000

interface MilestoneRow {
  label: string
  detail: string
  ratio: number
  met: boolean
}

/**
 * App invitation milestone tracker.
 *
 * The Android app is unlocked by proven repeat behaviour, never pushed before a
 * shop has felt the value. WhatsApp stays available afterwards, so the
 * invitation is optional and reversible.
 */
export function MilestoneTracker() {
  return (
    <Card>
      <CardHeader
        eyebrow="Progressive unlock"
        title="App invitation milestones"
        description="WhatsApp earns the first order; the app earns the operating system. Shops qualify on behaviour, not on marketing."
        action={
          <Badge tone="muted">
            <Smartphone aria-hidden className="size-3" />
            Android-first
          </Badge>
        }
      />
      <CardBody className="grid gap-3 md:grid-cols-3">
        {shops.map((shop) => {
          const rows: MilestoneRow[] = [
            {
              label: 'Procurement cycles',
              detail: `${shop.cyclesCompleted} of ${CYCLE_TARGET} within ${shop.cyclesWindowDays} days`,
              ratio: shop.cyclesCompleted / CYCLE_TARGET,
              met: shop.cyclesCompleted >= CYCLE_TARGET && shop.cyclesWindowDays <= 60,
            },
            {
              label: 'Recurring SKUs',
              detail: `${shop.recurringSkus} of ${SKU_TARGET}`,
              ratio: shop.recurringSkus / SKU_TARGET,
              met: shop.recurringSkus >= SKU_TARGET,
            },
            {
              label: 'Monthly volume',
              detail: `${formatRand(shop.monthlyVolumeCents)} of ${formatRand(VOLUME_TARGET_CENTS)}`,
              ratio: shop.monthlyVolumeCents / VOLUME_TARGET_CENTS,
              met: shop.monthlyVolumeCents >= VOLUME_TARGET_CENTS,
            },
          ]

          const behaviourMet = (rows[0]?.met ?? false) && (rows[1]?.met ?? false)
          const qualifies = behaviourMet || (rows[2]?.met ?? false) || shop.isHub

          return (
            <div key={shop.id} className="rounded-xl border border-ink-100 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink-900">{shop.name}</p>
                  <p className="truncate text-[11.5px] text-ink-300">{shop.ownerName}</p>
                </div>
                {qualifies ? (
                  <Badge tone="brand">
                    <Check aria-hidden className="size-3" />
                    {shop.appInvited ? 'App active' : 'Invite ready'}
                  </Badge>
                ) : (
                  <Badge tone="muted">WhatsApp</Badge>
                )}
              </div>

              <div className="mt-3 space-y-2.5">
                {rows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-[11.5px]">
                      <span className="font-medium text-ink-700">{row.label}</span>
                      <span className="tabular text-ink-500">{row.detail}</span>
                    </div>
                    <ProgressBar
                      ratio={row.ratio}
                      tone={row.met ? 'brand' : 'ochre'}
                      label={row.label}
                    />
                  </div>
                ))}
              </div>

              {shop.isHub ? (
                <p className="mt-2.5 text-[11.5px] leading-snug text-brand-600">
                  Qualifies through the hub role: receiving scans and handover verification need
                  app-based workflows.
                </p>
              ) : null}
            </div>
          )
        })}
      </CardBody>
    </Card>
  )
}
