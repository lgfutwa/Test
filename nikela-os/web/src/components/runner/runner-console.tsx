'use client'

import { Clock, MapPin, ShieldAlert, TriangleAlert, Truck, Weight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { GateChecklist } from '@/components/ui/gate-checklist'
import { MoneyLine } from '@/components/ui/money-line'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatTile } from '@/components/ui/stat-tile'
import { cn } from '@/lib/cn'
import {
  findHub,
  findRunner,
  findZone,
  routeCandidates,
  serviceTierLabels,
} from '@/lib/data/network'
import { evaluateRouteGate, floorPositioning, routeCostTotal, runnerPayout } from '@/lib/economics'
import { logger } from '@/lib/logger'
import { formatCents, formatRand } from '@/lib/money'

const CAPACITY_OPTIONS = [25, 45, 65, 120]

/**
 * Runner console.
 *
 * A runner declares a trip they are already making, and sees only routes whose
 * gate has passed. Every offer discloses the full payout stack before
 * acceptance, and declining costs nothing.
 */
export function RunnerConsole() {
  const runner = findRunner('run_nomsa')
  const [capacityKg, setCapacityKg] = useState(65)
  const [acceptedRouteId, setAcceptedRouteId] = useState<string | null>(null)

  const evaluations = useMemo(
    () =>
      routeCandidates.map((route) => {
        const gate = evaluateRouteGate({
          ledger: route.ledger,
          prepaidOrders: route.prepaidOrders,
          availablePerHandoverCents: route.availablePerHandoverCents,
          cargoKg: route.cargoKg,
          capacityKg: route.runnerId === runner?.id ? capacityKg : route.capacityKg,
          windowConfirmed: route.windowConfirmed,
          fallbackAvailable: route.fallbackAvailable,
        })

        const payout = runnerPayout({
          baseCents: 6000,
          weightKg: Math.min(route.cargoKg, capacityKg),
          weightRateCentsPerKg: 22,
          incrementalKm: route.incrementalKm,
          distanceRateCentsPerKm: 380,
          clusterHandovers: Math.max(route.prepaidOrders - gate.minimumHandovers, 0),
          clusterRateCents: 850,
          qualityScore: runner?.reliabilityScore ?? 0.9,
          qualityMaxCents: 2500,
          riskPremiumCents: findZone(route.zoneId)?.riskClass === 'high' ? 3500 : 0,
        })

        return { route, gate, payout, positioning: floorPositioning(gate.floorCentsPerHandover) }
      }),
    [capacityKg, runner?.id, runner?.reliabilityScore]
  )

  const offered = evaluations.filter((entry) => entry.gate.passed)
  const held = evaluations.filter((entry) => !entry.gate.passed)

  function handleAccept(routeId: string, totalCents: number) {
    setAcceptedRouteId(routeId)
    logger.info('Route offer accepted', { routeId, payoutCents: totalCents })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Runner"
          value={runner?.name ?? 'Runner'}
          hint={`${runner?.completedRoutes ?? 0} completed routes`}
        />
        <StatTile
          label="Reliability score"
          value={`${Math.round((runner?.reliabilityScore ?? 0) * 100)}%`}
          hint="On-time, accuracy and dispute history"
          tone="positive"
        />
        <StatTile
          label="Verification tier"
          value={runner?.kycTier === 't2_enhanced' ? 'T2 enhanced' : 'T1 identity'}
          hint="ID, endorsement and premises check"
        />
        <StatTile
          label="Offers open"
          value={`${offered.length}`}
          hint={`${held.length} held below their gate`}
        />
      </div>

      <Card>
        <CardHeader
          eyebrow="Trip declaration"
          title="Tell us about a trip you are already making"
          description="Payment covers the incremental detour and load, not the whole trip: that is what separates community logistics from courier work."
          action={
            <Badge tone="muted">
              <Truck aria-hidden className="size-3" />
              {runner?.vehicle === 'taxi' ? 'Taxi' : 'Own vehicle'}
            </Badge>
          }
        />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">
              Departing
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-medium text-ink-900">
              <Clock aria-hidden className="size-3.5 text-ink-300" />
              Thursday 09:30
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">Route</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-medium text-ink-900">
              <MapPin aria-hidden className="size-3.5 text-ink-300" />
              Site C → Bellville → Site C
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">
              Spare capacity
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CAPACITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCapacityKg(option)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition-colors',
                    capacityKg === option
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface text-ink-500 ring-1 ring-ink-100 hover:text-ink-900'
                  )}
                >
                  <Weight aria-hidden className="size-3" />
                  {option} kg
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {evaluations.map(({ route, gate, payout, positioning }) => {
        const hub = findHub(route.hubId)
        const zone = findZone(route.zoneId)
        const accepted = acceptedRouteId === route.id
        return (
          <Card key={route.id} className={cn(accepted && 'border-brand-300')}>
            <CardHeader
              eyebrow={`${serviceTierLabels[route.tier]} · ${route.departsAt}`}
              title={route.label}
              description={`${hub?.name ?? 'Hub'} · ${zone?.name ?? ''} · ${route.stops} stop(s) · ${route.incrementalKm} km incremental`}
              action={
                gate.passed ? (
                  <Badge tone={accepted ? 'brand' : 'ochre'}>
                    {accepted ? 'Accepted' : 'Offer open'}
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    <TriangleAlert aria-hidden className="size-3" />
                    Held below gate
                  </Badge>
                )
              }
            />
            <CardBody className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                  Release gate
                </p>
                <GateChecklist checks={gate.checks} />
                <div className="mt-3 rounded-xl bg-surface p-3">
                  <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                    <span className="font-medium text-ink-700">Prepaid density</span>
                    <span className="tabular text-ink-500">
                      {route.prepaidOrders} of {gate.minimumHandovers} required
                    </span>
                  </div>
                  <ProgressBar
                    ratio={route.prepaidOrders / Math.max(gate.minimumHandovers, 1)}
                    tone={gate.passed ? 'brand' : 'danger'}
                    label="Prepaid density against minimum"
                  />
                  <p className="tabular mt-2 text-[11.5px] text-ink-500">
                    Route cost {formatCents(routeCostTotal(route.ledger))} · floor{' '}
                    {formatCents(gate.floorCentsPerHandover)} per handover · available{' '}
                    {formatCents(route.availablePerHandoverCents)}
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

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                  Your payout, before you accept
                </p>
                <div className="space-y-0.5">
                  {payout.components.map((component) => (
                    <MoneyLine
                      key={component.id}
                      label={component.label}
                      amountCents={component.amountCents}
                      note={component.basis}
                      emphasis={component.amountCents === 0 ? 'muted' : 'normal'}
                    />
                  ))}
                  <MoneyLine
                    label="Total route reward"
                    amountCents={payout.totalCents}
                    emphasis="total"
                  />
                </div>
              </div>
            </CardBody>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3">
              {gate.passed ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => handleAccept(route.id, payout.totalCents)}
                    disabled={accepted}
                  >
                    {accepted ? 'Route accepted' : `Accept for ${formatRand(payout.totalCents)}`}
                  </Button>
                  <Button variant="secondary">Decline</Button>
                  <span className="text-[11.5px] text-ink-300">
                    Declining costs nothing and does not affect your score.
                  </span>
                </div>
              ) : (
                <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-500">
                  <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-danger-500" />
                  This route cannot be offered until its gate passes. It will be re-bundled with
                  nearby tasks, fall back to hub collection, or be cancelled with automatic refunds
                  at window expiry.
                </p>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
