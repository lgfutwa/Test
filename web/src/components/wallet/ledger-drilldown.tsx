'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { type JournalEntry, journal } from '@/lib/data/ledger'
import { formatCents } from '@/lib/money'

const kindLabels: Record<JournalEntry['kind'], { label: string; tone: BadgeTone }> = {
  saving_allocation: { label: 'Saving allocation', tone: 'brand' },
  runner_reward: { label: 'Runner reward', tone: 'ochre' },
  hub_fee: { label: 'Hub fee', tone: 'ochre' },
  platform_fee: { label: 'Platform fee', tone: 'muted' },
  referral_reward: { label: 'Referral reward', tone: 'muted' },
  refund: { label: 'Refund', tone: 'warn' },
  claim_adjustment: { label: 'Claim adjustment', tone: 'danger' },
}

/**
 * Journal drill-down.
 *
 * Each entry balances to zero and names the verified source event that
 * justified it, which is what makes a member statement auditable rather than
 * merely presentable.
 */
export function LedgerDrilldown() {
  const [openId, setOpenId] = useState<string | null>(journal[0]?.id ?? null)

  return (
    <Card>
      <CardHeader
        eyebrow="Journal"
        title="Every cent traces to a verified event"
        description="Expand an entry to see the balanced postings and the event that triggered them."
      />
      <CardBody className="space-y-2">
        {journal.map((entry) => {
          const open = openId === entry.id
          const meta = kindLabels[entry.kind]
          const balance = entry.postings.reduce((sum, posting) => sum + posting.amountCents, 0)
          return (
            <div key={entry.id} className="rounded-xl border border-ink-100">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : entry.id)}
                aria-expanded={open}
                className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="font-mono text-[11.5px] text-ink-300">
                      {entry.orderRef ?? entry.routeId}
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] font-medium text-ink-900">
                    {entry.narrative}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-300">
                    {entry.postedAt} · <code className="font-mono">{entry.sourceEvent}</code>
                  </span>
                </span>
                {open ? (
                  <ChevronDown aria-hidden className="mt-1 size-4 shrink-0 text-ink-300" />
                ) : (
                  <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-300" />
                )}
              </button>

              {open ? (
                <div className="border-t border-ink-100 px-3 py-2.5">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-ink-300">
                        <th className="pb-1 font-semibold">Account</th>
                        <th className="pb-1 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.postings.map((posting) => (
                        <tr key={`${entry.id}-${posting.account}`} className="text-[12.5px]">
                          <td className="py-1 text-ink-700">{posting.account}</td>
                          <td
                            className={cn(
                              'tabular py-1 text-right font-medium',
                              posting.amountCents < 0 ? 'text-ink-500' : 'text-brand-600'
                            )}
                          >
                            {formatCents(posting.amountCents, { showSign: true })}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-ink-100 text-[12.5px] font-semibold">
                        <td className="pt-1.5 text-ink-900">Balance check</td>
                        <td
                          className={cn(
                            'tabular pt-1.5 text-right',
                            balance === 0 ? 'text-brand-600' : 'text-danger-500'
                          )}
                        >
                          {balance === 0 ? 'Balances to zero' : formatCents(balance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )
        })}
      </CardBody>
    </Card>
  )
}
