'use client'

import { Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { MoneyLine } from '@/components/ui/money-line'
import { ProgressBar } from '@/components/ui/progress-bar'
import { referralReward } from '@/lib/economics'
import { formatCents, formatPercent, formatRand } from '@/lib/money'

const REFERRAL_RATIO = 0.01
const REFERRAL_CAP_CENTS = 5000

const operationalRewardsCents = 1_842_600
const referralPaidCents = 38_400

/**
 * Referral reward audit.
 *
 * This is the Consumer Protection Act evidence pack: it demonstrates that
 * compensation is dominated by product movement and verified operations rather
 * than recruitment, and that a referral cannot compound past its cap.
 */
export function ReferralAudit() {
  const [orderValueRand, setOrderValueRand] = useState(1200)
  const [alreadyPaidRand, setAlreadyPaidRand] = useState(0)

  const reward = useMemo(
    () =>
      referralReward(
        Math.round(orderValueRand * 100),
        REFERRAL_RATIO,
        REFERRAL_CAP_CENTS,
        Math.round(alreadyPaidRand * 100)
      ),
    [orderValueRand, alreadyPaidRand]
  )

  const totalRewards = operationalRewardsCents + referralPaidCents
  const referralShare = referralPaidCents / totalRewards

  return (
    <Card>
      <CardHeader
        eyebrow="CPA s43(4) evidence"
        title="Referral rewards are capped, single-tier, and paid only after real orders"
        description="Earnings come from product movement and verified operations. Recruitment cannot be the dominant income source, because the structure does not allow it."
        action={<Badge tone="brand">Single tier by schema</Badge>}
      />
      <CardBody className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
            Reward composition this quarter
          </p>
          <div className="space-y-0.5">
            <MoneyLine
              label="Operational rewards"
              amountCents={operationalRewardsCents}
              note="Runner routes, hub handovers, coordination"
            />
            <MoneyLine
              label="Referral rewards"
              amountCents={referralPaidCents}
              note="One tier, capped per referred participant"
            />
            <MoneyLine
              label="Total paid to participants"
              amountCents={totalRewards}
              emphasis="total"
            />
          </div>
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
              <span className="font-medium text-ink-700">Referral share of all rewards</span>
              <span className="tabular text-ink-500">{formatPercent(referralShare, 2)}</span>
            </div>
            <ProgressBar ratio={referralShare} tone="ochre" label="Referral share of rewards" />
            <p className="mt-1.5 text-[11.5px] leading-snug text-ink-500">
              {formatRand(operationalRewardsCents)} of {formatRand(totalRewards)} went to verified
              logistics and coordination work.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
            Reward calculator
          </p>
          <div className="space-y-3 rounded-xl bg-surface p-3">
            <div>
              <label
                htmlFor="order-value"
                className="flex items-baseline justify-between text-[12px] font-medium text-ink-700"
              >
                Referred participant's reconciled order
                <span className="tabular text-ink-500">{formatRand(orderValueRand * 100)}</span>
              </label>
              <input
                id="order-value"
                type="range"
                min={100}
                max={20000}
                step={100}
                value={orderValueRand}
                onChange={(event) => setOrderValueRand(Number(event.target.value))}
                className="mt-1.5 w-full accent-brand-500"
              />
            </div>
            <div>
              <label
                htmlFor="already-paid"
                className="flex items-baseline justify-between text-[12px] font-medium text-ink-700"
              >
                Already paid for this referral
                <span className="tabular text-ink-500">{formatRand(alreadyPaidRand * 100)}</span>
              </label>
              <input
                id="already-paid"
                type="range"
                min={0}
                max={REFERRAL_CAP_CENTS / 100}
                step={1}
                value={alreadyPaidRand}
                onChange={(event) => setAlreadyPaidRand(Number(event.target.value))}
                className="mt-1.5 w-full accent-brand-500"
              />
            </div>
            <div className="space-y-0.5 border-t border-ink-100 pt-2">
              <MoneyLine
                label={`Uncapped at ${formatPercent(REFERRAL_RATIO, 0)}`}
                amountCents={Math.round(orderValueRand * 100 * REFERRAL_RATIO)}
                emphasis="muted"
              />
              <MoneyLine
                label="Cap remaining"
                amountCents={Math.max(REFERRAL_CAP_CENTS - Math.round(alreadyPaidRand * 100), 0)}
                emphasis="muted"
              />
              <MoneyLine label="Reward payable" amountCents={reward} emphasis="total" />
            </div>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-300">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            The cap is {formatCents(REFERRAL_CAP_CENTS)} per referred participant, lifetime. The
            reward is allocated into the referrer's savings bucket rather than paid as a separate
            cash commission.
          </p>
        </div>
      </CardBody>
      <CardFooter>
        <p className="text-[12px] leading-relaxed text-ink-500">
          No participant pays a joining fee, buys inventory to hold a role, or earns from recruiting
          alone. Every reward above traces to a reconciled order, a verified handover or a completed
          route.
        </p>
      </CardFooter>
    </Card>
  )
}
