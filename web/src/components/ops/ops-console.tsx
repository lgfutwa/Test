'use client'

import {
  Activity,
  BadgeCheck,
  Ban,
  ClipboardCheck,
  Lock,
  MessageSquareWarning,
  Play,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { GateChecklist } from '@/components/ui/gate-checklist'
import { MoneyLine } from '@/components/ui/money-line'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatTile } from '@/components/ui/stat-tile'
import { cn } from '@/lib/cn'
import {
  currentCycle,
  type OrderStatus,
  type OrderSummary,
  orderDesk,
  orderStatusLabels,
} from '@/lib/data/cycles'
import { reconciledStatement } from '@/lib/data/ledger'
import {
  findHub,
  findRunner,
  findZone,
  routeCandidates,
  serviceTierLabels,
} from '@/lib/data/network'
import { evaluateRouteGate, floorPositioning, routeCostTotal } from '@/lib/economics'
import { logger } from '@/lib/logger'
import { formatCents, formatPercent, formatRand } from '@/lib/money'

const statusTones: Record<OrderStatus, BadgeTone> = {
  draft: 'muted',
  quoted: 'ochre',
  confirmed: 'brand',
  pooled: 'brand',
  locked: 'brand',
  procured: 'brand',
  at_hub: 'brand',
  fulfilled: 'brand',
  exception: 'danger',
  reconciled: 'neutral',
}

const paymentTones: Record<OrderSummary['paymentState'], BadgeTone> = {
  unpaid: 'danger',
  pending: 'warn',
  settled: 'brand',
}

type Tab = 'orders' | 'routes' | 'reconciliation'

const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'orders', label: 'Order desk', icon: ClipboardCheck },
  { id: 'routes', label: 'Route control', icon: Activity },
  { id: 'reconciliation', label: 'Reconciliation', icon: BadgeCheck },
]

/**
 * Ops console.
 *
 * The control room must be able to run a pilot by hand: confirm orders on a
 * user's behalf, lock a cycle, evaluate a route gate, and reconcile a cycle.
 * Overrides exist, but they are reason-coded and recorded, never silent.
 */
export function OpsConsole() {
  const [tab, setTab] = useState<Tab>('orders')

  return (
    <div className="space-y-4">
      <nav aria-label="Ops sections">
        <ul className="flex flex-wrap gap-1.5">
          {tabs.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setTab(entry.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                  tab === entry.id
                    ? 'bg-ink-900 text-white'
                    : 'bg-canvas text-ink-500 ring-1 ring-ink-100 hover:text-ink-900'
                )}
              >
                <entry.icon aria-hidden className="size-3.5" />
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'orders' ? <OrderDesk /> : null}
      {tab === 'routes' ? <RouteControl /> : null}
      {tab === 'reconciliation' ? <ReconciliationDesk /> : null}
    </div>
  )
}

function OrderDesk() {
  const [cycleLocked, setCycleLocked] = useState(false)

  const settled = orderDesk.filter((order) => order.paymentState === 'settled')
  const unsettled = orderDesk.filter((order) => order.paymentState !== 'settled')
  const review = orderDesk.filter((order) => order.needsReview)
  const zone = findZone(currentCycle.zoneId)

  function lockCycle() {
    setCycleLocked(true)
    logger.info('Cycle locked by ops', {
      cycleId: currentCycle.id,
      includedOrders: settled.length,
      heldOrders: unsettled.length,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Open cycle"
          value={cycleLocked ? 'Locked' : 'Open'}
          hint={`${currentCycle.groupName} · ${zone?.name ?? ''}`}
        />
        <StatTile
          label="Committed value"
          value={formatRand(currentCycle.committedValueCents)}
          hint={`${orderDesk.length} orders on the desk`}
        />
        <StatTile
          label="Payment settled"
          value={`${settled.length}/${orderDesk.length}`}
          hint="Only settled orders enter the purchase order"
          tone={settled.length === orderDesk.length ? 'positive' : 'neutral'}
        />
        <StatTile
          label="Parsing review queue"
          value={`${review.length}`}
          hint="Low-confidence lines awaiting an agent"
          tone={review.length > 0 ? 'negative' : 'positive'}
        />
      </div>

      <Card>
        <CardHeader
          eyebrow="Order desk"
          title="Every order, every channel, one identity"
          description="The same order reference appears in WhatsApp, the app, the invoice, the hub scan list and the ledger."
          action={
            <Badge tone={cycleLocked ? 'brand' : 'ochre'}>
              <Lock aria-hidden className="size-3" />
              {cycleLocked ? 'Cycle locked' : `Locks ${currentCycle.locksAt}`}
            </Badge>
          }
        />
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-300">
                <th className="px-4 py-2.5 font-semibold">Order</th>
                <th className="px-4 py-2.5 font-semibold">Buyer</th>
                <th className="px-4 py-2.5 font-semibold">Channel</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Payment</th>
                <th className="px-4 py-2.5 text-right font-semibold">Quoted</th>
                <th className="px-4 py-2.5 text-right font-semibold">Saving</th>
              </tr>
            </thead>
            <tbody>
              {orderDesk.map((order) => {
                const saving = order.comparatorTotalCents - order.quotedTotalCents
                return (
                  <tr
                    key={order.id}
                    className="border-b border-ink-100 text-[13px] last:border-0 hover:bg-surface/70"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[12.5px] font-medium text-ink-900">
                        {order.orderRef}
                      </span>
                      {order.needsReview ? (
                        <span className="mt-1 block">
                          <Badge tone="warn">
                            <MessageSquareWarning aria-hidden className="size-3" />
                            Review
                          </Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="block font-medium text-ink-900">{order.buyerName}</span>
                      <span className="block text-[11.5px] text-ink-300">
                        {order.kind === 'household' ? 'Household' : 'Spaza procurement'} ·{' '}
                        {order.lineCount} lines
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] capitalize text-ink-500">
                      {order.channelOrigin.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={statusTones[order.status]}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={paymentTones[order.paymentState]}>{order.paymentState}</Badge>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right font-medium text-ink-900">
                      {formatCents(order.quotedTotalCents)}
                    </td>
                    <td
                      className={cn(
                        'tabular px-4 py-2.5 text-right font-semibold',
                        saving >= 0 ? 'text-brand-600' : 'text-danger-500'
                      )}
                    >
                      {formatCents(saving, { showSign: true })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardBody>
        <CardFooter className="flex flex-wrap items-center gap-3">
          <Button onClick={lockCycle} disabled={cycleLocked}>
            <Lock aria-hidden className="size-4" />
            {cycleLocked ? 'Cycle locked' : 'Lock cycle and place purchase order'}
          </Button>
          <p className="text-[12px] leading-relaxed text-ink-500">
            {cycleLocked
              ? `${settled.length} settled orders entered the consolidated purchase order. ${unsettled.length} unsettled order(s) were held for the next cycle with the buyer notified.`
              : `${unsettled.length} order(s) have not settled payment and will be held out of the purchase order at lock.`}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function RouteControl() {
  const evaluations = useMemo(
    () =>
      routeCandidates.map((route) => ({
        route,
        gate: evaluateRouteGate({
          ledger: route.ledger,
          prepaidOrders: route.prepaidOrders,
          availablePerHandoverCents: route.availablePerHandoverCents,
          cargoKg: route.cargoKg,
          capacityKg: route.capacityKg,
          windowConfirmed: route.windowConfirmed,
          fallbackAvailable: route.fallbackAvailable,
        }),
      })),
    []
  )

  const released = evaluations.filter((entry) => entry.gate.passed)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Candidate routes"
          value={`${evaluations.length}`}
          hint="Across three zones"
        />
        <StatTile
          label="Clearing their gate"
          value={`${released.length}`}
          hint="Releasable without subsidy"
          tone="positive"
        />
        <StatTile
          label="Held"
          value={`${evaluations.length - released.length}`}
          hint="Re-bundle, hub fallback, or cancel with refund"
          tone="negative"
        />
        <StatTile
          label="Default tier"
          value="Hub collection"
          hint="Doorstep only where density is proven"
        />
      </div>

      {evaluations.map(({ route, gate }) => {
        const positioning = floorPositioning(gate.floorCentsPerHandover)
        const runner = findRunner(route.runnerId)
        const hub = findHub(route.hubId)
        const zone = findZone(route.zoneId)
        return (
          <Card key={route.id}>
            <CardHeader
              eyebrow={`${serviceTierLabels[route.tier]} · ${zone?.name ?? ''} · ${route.departsAt}`}
              title={route.label}
              description={`${hub?.name ?? ''} · runner ${runner?.name ?? 'unassigned'} · ${route.confirmedOrders} confirmed, ${route.prepaidOrders} prepaid`}
              action={
                gate.passed ? (
                  <Badge tone="brand">
                    <Play aria-hidden className="size-3" />
                    Gate passed
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    <Ban aria-hidden className="size-3" />
                    Held
                  </Badge>
                )
              }
            />
            <CardBody className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                  Gate evaluation
                </p>
                <GateChecklist checks={gate.checks} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                  Route cost ledger
                </p>
                <div className="space-y-0.5">
                  <MoneyLine
                    label="Labour"
                    amountCents={route.ledger.labourCents}
                    note="Protected pool"
                  />
                  <MoneyLine
                    label="Fuel and vehicle"
                    amountCents={route.ledger.fuelVehicleCents}
                    note="Protected pool · incremental only"
                  />
                  <MoneyLine label="Hub" amountCents={route.ledger.hubCents} />
                  <MoneyLine label="Risk reserve" amountCents={route.ledger.riskCents} />
                  <MoneyLine label="Platform" amountCents={route.ledger.platformCents} />
                  <MoneyLine
                    label="Total route cost"
                    amountCents={routeCostTotal(route.ledger)}
                    emphasis="total"
                  />
                </div>
                <div className="mt-3 rounded-xl bg-surface p-3">
                  <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                    <span className="font-medium text-ink-700">Prepaid vs minimum handovers</span>
                    <span className="tabular text-ink-500">
                      {route.prepaidOrders} / {gate.minimumHandovers}
                    </span>
                  </div>
                  <ProgressBar
                    ratio={route.prepaidOrders / Math.max(gate.minimumHandovers, 1)}
                    tone={gate.passed ? 'brand' : 'danger'}
                    label="Prepaid density"
                  />
                  <p className="tabular mt-2 text-[11.5px] text-ink-500">
                    Floor {formatCents(gate.floorCentsPerHandover)} · available{' '}
                    {formatCents(route.availablePerHandoverCents)} · contribution{' '}
                    {formatCents(gate.contributionPerHandoverCents, { showSign: true })} per
                    handover
                  </p>
                  <p
                    className={cn(
                      'mt-1.5 text-[11.5px] leading-snug',
                      positioning.band === 'exception' ? 'text-danger-500' : 'text-ink-500'
                    )}
                  >
                    {positioning.message}
                  </p>
                </div>
              </div>
            </CardBody>
            <CardFooter className="flex flex-wrap items-center gap-2">
              <Button disabled={!gate.passed}>Release route</Button>
              <Button variant="secondary">Re-bundle with adjacent tasks</Button>
              <Button variant="secondary">Fall back to hub collection</Button>
              {!gate.passed ? (
                <span className="text-[11.5px] text-ink-300">
                  Release is disabled by the gate, not by permission: an override would need a
                  reason code and is recorded against the route.
                </span>
              ) : null}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

function ReconciliationDesk() {
  const comparator = reconciledStatement.lines[0]?.amountCents ?? 0
  const saving =
    reconciledStatement.lines.find((line) => line.emphasis === 'total')?.amountCents ?? 0

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          eyebrow="Reconciliation"
          title={`Statement ${reconciledStatement.orderRef}`}
          description={reconciledStatement.cycle}
          action={<Badge tone="brand">Reconciled</Badge>}
        />
        <CardBody className="space-y-0.5">
          {reconciledStatement.lines.map((line) => (
            <MoneyLine
              key={line.label}
              label={line.label}
              amountCents={line.amountCents}
              note={line.note}
              emphasis={line.emphasis === 'total' ? 'total' : 'normal'}
              showSign={line.emphasis === 'total'}
            />
          ))}
        </CardBody>
        <CardFooter>
          <p className="text-[12px] leading-relaxed text-ink-500">
            Comparator basis: {reconciledStatement.comparatorBasis}. The saving of{' '}
            {formatCents(saving)} is {formatPercent(saving / Math.max(comparator, 1))} of the
            comparator basket, and only posts to the ledger once the supplier invoice is final.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Controls"
          title="What reconciliation guarantees"
          description="A quoted price is a ceiling. A better tier improves it; a worse price needs re-confirmation."
        />
        <CardBody>
          <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-ink-500">
            <li>
              <span className="font-medium text-ink-900">Invoice ingestion</span> — supplier
              invoices and credit notes are matched to allocation lines; partial fulfilment
              reconciles to the cent.
            </li>
            <li>
              <span className="font-medium text-ink-900">Savings posting</span> — the verified
              saving is computed only after the final invoice, then split per the member's recorded
              allocation choice.
            </li>
            <li>
              <span className="font-medium text-ink-900">Three-way check</span> — platform ledger,
              partner settlement report and supplier invoice are reconciled monthly, with exceptions
              queued rather than silently adjusted.
            </li>
            <li>
              <span className="font-medium text-ink-900">Append-only history</span> — corrections
              are new entries with a reason code and an approver, never edits.
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
