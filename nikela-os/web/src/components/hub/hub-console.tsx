'use client'

import { Boxes, CircleCheck, KeyRound, PackageX, ScanLine, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatTile } from '@/components/ui/stat-tile'
import { cn } from '@/lib/cn'
import {
  type HubCollection,
  type HubExpectedLine,
  hubCollections,
  hubExpectedLines,
} from '@/lib/data/cycles'
import { findHub } from '@/lib/data/network'
import { logger } from '@/lib/logger'
import { formatCents, formatRand } from '@/lib/money'

const HUB_FEE_PER_HANDOVER_CENTS = 600

type PinState = 'idle' | 'verified' | 'rejected'

/**
 * Hub operator console.
 *
 * Chain of custody is unbroken: every unit is scanned in against an expected
 * allocation, and every handover needs a single-use PIN the operator never
 * sees. The hub fee accrues only on a verified handover.
 */
export function HubConsole() {
  const hub = findHub('hub_sibongile')
  const [lines, setLines] = useState<HubExpectedLine[]>(hubExpectedLines)
  const [collections, setCollections] = useState<HubCollection[]>(hubCollections)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    hubCollections[0]?.id ?? null
  )
  const [pinInput, setPinInput] = useState('')
  const [pinState, setPinState] = useState<PinState>('idle')

  const totals = useMemo(() => {
    const expected = lines.reduce((sum, line) => sum + line.expectedUnits, 0)
    const scanned = lines.reduce((sum, line) => sum + line.scannedUnits, 0)
    const exceptions = lines.filter((line) => line.status === 'short' || line.status === 'damaged')
    const verified = collections.filter((entry) => entry.status === 'verified')
    return {
      expected,
      scanned,
      exceptions,
      verifiedHandovers: verified.length,
      earnedCents: verified.length * HUB_FEE_PER_HANDOVER_CENTS,
    }
  }, [lines, collections])

  const activeCollection = collections.find((entry) => entry.id === activeCollectionId) ?? null

  function scanLine(lineId: string) {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? { ...line, scannedUnits: line.expectedUnits, status: 'received' }
          : line
      )
    )
    logger.info('Stock scanned in at hub', { lineId, hubId: hub?.id })
  }

  function flagShort(lineId: string) {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              scannedUnits: Math.max(line.expectedUnits - 1, 0),
              status: 'short',
            }
          : line
      )
    )
    logger.warn('Short delivery flagged at receiving', { lineId, hubId: hub?.id })
  }

  function scanAll() {
    setLines((current) =>
      current.map((line) =>
        line.status === 'awaiting'
          ? { ...line, scannedUnits: line.expectedUnits, status: 'received' }
          : line
      )
    )
    logger.info('Bulk scan-in completed', { hubId: hub?.id })
  }

  function verifyPin() {
    if (!activeCollection) {
      return
    }
    if (pinInput === activeCollection.pin) {
      setCollections((current) =>
        current.map((entry) =>
          entry.id === activeCollection.id ? { ...entry, status: 'verified' } : entry
        )
      )
      setPinState('verified')
      setPinInput('')
      logger.info('Handover verified', {
        orderRef: activeCollection.orderRef,
        hubId: hub?.id,
        feeCents: HUB_FEE_PER_HANDOVER_CENTS,
      })
      return
    }
    setPinState('rejected')
    logger.warn('Handover PIN rejected', { orderRef: activeCollection.orderRef })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Hub"
          value={hub?.kind === 'spaza' ? 'Spaza hub' : 'Community hub'}
          hint={hub?.operatingHours}
        />
        <StatTile
          label="Stock value cap"
          value={formatRand(hub?.maxStockValueCents ?? 0)}
          hint="Insured ceiling per cycle"
        />
        <StatTile
          label="Verified handovers"
          value={`${totals.verifiedHandovers}`}
          hint={`Earned ${formatCents(totals.earnedCents)} this cycle`}
          tone="positive"
        />
        <StatTile
          label="Shrinkage rate"
          value={`${((hub?.shrinkageRate ?? 0) * 100).toFixed(2)}%`}
          hint="Feeds reliability score and insurability"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader
            eyebrow="Receiving"
            title="Scan consolidated stock in"
            description="Discrepancies are logged at the door, before the goods enter the hub's custody."
            action={
              <Button size="sm" variant="secondary" onClick={scanAll}>
                <ScanLine aria-hidden className="size-3.5" />
                Scan all
              </Button>
            }
          />
          <CardBody className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                <span className="font-medium text-ink-700">Units received</span>
                <span className="tabular text-ink-500">
                  {totals.scanned} of {totals.expected}
                </span>
              </div>
              <ProgressBar
                ratio={totals.expected === 0 ? 0 : totals.scanned / totals.expected}
                label="Units received against expected"
              />
            </div>

            {lines.map((line) => (
              <div
                key={line.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
                  line.status === 'received' && 'border-brand-200 bg-brand-50/40',
                  line.status === 'short' && 'border-danger-500/30 bg-danger-50',
                  line.status === 'awaiting' && 'border-ink-100'
                )}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">
                    {line.expectedUnits} × {line.skuName}{' '}
                    <span className="text-ink-500">{line.packSize}</span>
                  </p>
                  <p className="truncate text-[11.5px] text-ink-300">
                    {line.orderRef} · {line.buyerName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {line.status === 'awaiting' ? (
                    <>
                      <Button size="sm" onClick={() => scanLine(line.id)}>
                        Scan in
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => flagShort(line.id)}>
                        Short
                      </Button>
                    </>
                  ) : line.status === 'received' ? (
                    <Badge tone="brand">
                      <CircleCheck aria-hidden className="size-3" />
                      {line.scannedUnits} received
                    </Badge>
                  ) : (
                    <Badge tone="danger">
                      <PackageX aria-hidden className="size-3" />
                      Short by {line.expectedUnits - line.scannedUnits}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {totals.exceptions.length > 0 ? (
              <p className="rounded-lg bg-danger-50 px-3 py-2 text-[12px] leading-relaxed text-danger-500">
                {totals.exceptions.length} exception line(s) opened a claim with photo evidence. The
                affected buyer is notified automatically and a credit note is raised against the
                supplier invoice.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              eyebrow="Handover"
              title="Verify with a single-use PIN"
              description="The operator never sees the PIN. It arrives on the collector's phone with SMS fallback."
              action={
                <Badge tone="muted">
                  <KeyRound aria-hidden className="size-3" />
                  Proof of handover
                </Badge>
              }
            />
            <CardBody className="space-y-3">
              <div className="space-y-2">
                {collections.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setActiveCollectionId(entry.id)
                      setPinState('idle')
                      setPinInput('')
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                      activeCollectionId === entry.id
                        ? 'border-brand-300 bg-brand-50/50'
                        : 'border-ink-100 hover:bg-surface'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-ink-900">
                        {entry.buyerName}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-300">
                        {entry.orderRef} · {entry.units} units · window closes{' '}
                        {entry.windowClosesAt}
                      </span>
                    </span>
                    {entry.status === 'verified' ? (
                      <Badge tone="brand">Verified</Badge>
                    ) : entry.status === 'window_expired' ? (
                      <Badge tone="warn">Window expired</Badge>
                    ) : (
                      <Badge tone="ochre">Awaiting</Badge>
                    )}
                  </button>
                ))}
              </div>

              {activeCollection && activeCollection.status === 'awaiting_collection' ? (
                <div className="rounded-xl border border-ink-100 p-3">
                  <label
                    htmlFor="pin"
                    className="text-[11px] font-semibold uppercase tracking-wider text-ink-300"
                  >
                    Enter collector PIN for {activeCollection.orderRef}
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="pin"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinInput}
                      onChange={(event) => {
                        setPinInput(event.target.value.replace(/\D/g, ''))
                        setPinState('idle')
                      }}
                      placeholder="••••"
                      className="tabular w-24 rounded-lg border border-ink-100 px-3 py-2 text-center text-lg tracking-[0.3em] outline-none focus-visible:border-brand-400"
                    />
                    <Button onClick={verifyPin} disabled={pinInput.length < 4}>
                      Verify handover
                    </Button>
                  </div>
                  {pinState === 'rejected' ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-danger-500">
                      <TriangleAlert aria-hidden className="size-3.5" />
                      PIN does not match. Ask the collector to re-read the message, or escalate to
                      ops — do not hand over without verification.
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11.5px] leading-snug text-ink-300">
                    Hint for this demo: the PIN is {activeCollection.pin}.
                  </p>
                </div>
              ) : null}

              {activeCollection?.status === 'window_expired' ? (
                <div className="rounded-xl bg-warn-50 p-3 text-[12px] leading-relaxed text-warn-500">
                  Collection window closed. The fallback flow runs automatically: the buyer is
                  offered a reschedule into the next cycle, a pre-authorised proxy collector, or a
                  refund. The hub fee is not earned on an expired window.
                </div>
              ) : null}

              {pinState === 'verified' ? (
                <div className="rounded-xl bg-brand-50/70 p-3 text-[12px] leading-relaxed text-ink-700">
                  <p className="font-semibold text-brand-700">Handover verified.</p>
                  <p className="mt-0.5">
                    <code className="font-mono text-[11.5px]">handover.verified.v1</code> emitted:
                    the hub fee of {formatCents(HUB_FEE_PER_HANDOVER_CENTS)} accrues, the buyer's
                    statement unlocks, and the reliability score updates.
                  </p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Custody"
              title="Everything in, everything out"
              description="Each movement records the acting role, so a dispute or insurance claim always has an accountable leg."
              action={
                <Badge tone="muted">
                  <Boxes aria-hidden className="size-3" />
                  Movement ledger
                </Badge>
              }
            />
            <CardBody>
              <ul className="space-y-2 text-[12.5px] leading-relaxed text-ink-500">
                <li>
                  <span className="font-medium text-ink-900">Scan-in</span> against the expected
                  allocation, with shortages and damage logged before acceptance.
                </li>
                <li>
                  <span className="font-medium text-ink-900">Storage</span> within the insured value
                  cap and the agreed window; breaches alert ops automatically.
                </li>
                <li>
                  <span className="font-medium text-ink-900">Scan-out</span> only after PIN or QR
                  verification, which is what triggers the hub fee.
                </li>
                <li>
                  <span className="font-medium text-ink-900">Reconciliation</span> compares counts
                  to the movement ledger; shrinkage feeds the reliability score.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
