import { type Cents, formatCents, splitByWeights } from './money'

/**
 * Economics engine for Nikela-OS.
 *
 * These are the only implementations of the platform's commercial formulas.
 * Surfaces (StoreOnline, Procurement, Runner, Hub, Ops) render their output but
 * never recompute pricing locally, so a member, a shop owner and an ops
 * operator always see the same number for the same order.
 *
 * Reference: design/nikela-os/05-logistics-route-economics.md and
 * design/nikela-os/06-payments-wallet-finance.md
 */

/** A supplier price break: unit price applies from `minUnits` upward. */
export interface PriceTier {
  minUnits: number
  unitPriceCents: Cents
}

/** Fee components that must be separately visible before order confirmation. */
export interface FeeBreakdown {
  supplierCents: Cents
  logisticsCents: Cents
  hubCents: Cents
  platformCents: Cents
}

export interface LandedCostInput {
  units: number
  tiers: readonly PriceTier[]
  /** Logistics allocation per unit for the chosen service tier. */
  logisticsPerUnitCents: Cents
  /** Hub handling fee per unit, charged only on successful handover. */
  hubPerUnitCents: Cents
  /** Platform coordination fee as a ratio of supplier cost. */
  platformFeeRatio: number
}

export interface LandedCostResult extends FeeBreakdown {
  appliedTier: PriceTier
  totalCents: Cents
  perUnitCents: Cents
}

/** Selects the best tier a given quantity qualifies for. */
export function selectTier(units: number, tiers: readonly PriceTier[]): PriceTier {
  const sorted = [...tiers].sort((a, b) => a.minUnits - b.minUnits)
  let applied = sorted[0]
  if (!applied) {
    throw new Error('At least one price tier is required')
  }
  for (const tier of sorted) {
    if (units >= tier.minUnits) {
      applied = tier
    }
  }
  return applied
}

/** Units still needed to unlock the next cheaper tier, or null at the best tier. */
export function unitsToNextTier(
  units: number,
  tiers: readonly PriceTier[]
): { tier: PriceTier; unitsNeeded: number } | null {
  const next = [...tiers]
    .sort((a, b) => a.minUnits - b.minUnits)
    .find((tier) => tier.minUnits > units)
  return next ? { tier: next, unitsNeeded: next.minUnits - units } : null
}

/**
 * Computes the landed cost of a line with every fee separated.
 *
 * Transparency principle: the caller receives the components, not just a
 * total, because the platform must disclose supplier price, logistics fee,
 * hub fee and platform fee before the buyer confirms.
 */
export function landedCost(input: LandedCostInput): LandedCostResult {
  const appliedTier = selectTier(input.units, input.tiers)
  const supplierCents = appliedTier.unitPriceCents * input.units
  const logisticsCents = input.logisticsPerUnitCents * input.units
  const hubCents = input.hubPerUnitCents * input.units
  const platformCents = Math.round(supplierCents * input.platformFeeRatio)
  const totalCents = supplierCents + logisticsCents + hubCents + platformCents

  return {
    appliedTier,
    supplierCents,
    logisticsCents,
    hubCents,
    platformCents,
    totalCents,
    perUnitCents: input.units > 0 ? Math.round(totalCents / input.units) : 0,
  }
}

/**
 * Verified saving after every fee, measured against the disclosed retail
 * comparator. A negative result is a real outcome and must be shown as such
 * rather than clamped to zero.
 */
export function verifiedSaving(comparatorCents: Cents, landed: FeeBreakdown): Cents {
  const landedTotal =
    landed.supplierCents + landed.logisticsCents + landed.hubCents + landed.platformCents
  return comparatorCents - landedTotal
}

/** Member-selected destinations for a verified saving. */
export interface SavingAllocation {
  immediateDiscount: number
  personalSavings: number
  emergencyBuffer: number
  communityInvestment: number
}

export interface AllocatedSaving {
  immediateDiscountCents: Cents
  personalSavingsCents: Cents
  emergencyBufferCents: Cents
  communityInvestmentCents: Cents
}

/**
 * Splits a verified saving across the member's chosen buckets.
 *
 * Group buckets (emergency buffer, community investment) are only ever funded
 * from weights the member set themselves; there is no implicit contribution.
 */
export function allocateSaving(savingCents: Cents, allocation: SavingAllocation): AllocatedSaving {
  const weights = [
    allocation.immediateDiscount,
    allocation.personalSavings,
    allocation.emergencyBuffer,
    allocation.communityInvestment,
  ]
  const [immediate = 0, personal = 0, emergency = 0, community = 0] = splitByWeights(
    Math.max(savingCents, 0),
    weights
  )

  return {
    immediateDiscountCents: immediate,
    personalSavingsCents: personal,
    emergencyBufferCents: emergency,
    communityInvestmentCents: community,
  }
}

/** The five protected cost pools of a route. */
export interface RouteCostLedger {
  labourCents: Cents
  fuelVehicleCents: Cents
  hubCents: Cents
  riskCents: Cents
  platformCents: Cents
}

/** Sums the route cost ledger. */
export function routeCostTotal(ledger: RouteCostLedger): Cents {
  return (
    ledger.labourCents +
    ledger.fuelVehicleCents +
    ledger.hubCents +
    ledger.riskCents +
    ledger.platformCents
  )
}

/**
 * Price floor per successful handover, including the target contribution.
 *
 * The denominator is successful handovers, never orders placed: a route with
 * twelve promises and seven completions carries the cost of twelve.
 */
export function priceFloorPerHandover(
  ledger: RouteCostLedger,
  successfulHandovers: number,
  targetMarginCents: Cents = 0
): Cents {
  if (successfulHandovers <= 0) {
    return Number.POSITIVE_INFINITY
  }
  return Math.ceil(routeCostTotal(ledger) / successfulHandovers) + targetMarginCents
}

/** Minimum prepaid handovers required before a route may be released. */
export function minimumHandovers(
  ledger: RouteCostLedger,
  availablePerHandoverCents: Cents
): number {
  if (availablePerHandoverCents <= 0) {
    return Number.POSITIVE_INFINITY
  }
  return Math.ceil(routeCostTotal(ledger) / availablePerHandoverCents)
}

/** Service tiers, ordered from lowest to highest final-mile unit cost. */
export type ServiceTier =
  | 'hub_collection'
  | 'cluster_drop'
  | 'doorstep'
  | 'existing_trip'
  | 'cold_chain'

export interface GateInput {
  ledger: RouteCostLedger
  /** Confirmed orders whose payment has settled. */
  prepaidOrders: number
  /** Revenue available per handover from delivery fees and margin. */
  availablePerHandoverCents: Cents
  cargoKg: number
  capacityKg: number
  windowConfirmed: boolean
  fallbackAvailable: boolean
  targetMarginCents?: Cents
}

export type GateCheckId = 'density' | 'capacity' | 'window' | 'floor' | 'fallback'

export interface GateCheck {
  id: GateCheckId
  label: string
  passed: boolean
  detail: string
}

export interface GateResult {
  passed: boolean
  checks: GateCheck[]
  minimumHandovers: number
  floorCentsPerHandover: Cents
  /** Positive when the route clears its floor per handover. */
  contributionPerHandoverCents: Cents
}

/**
 * Evaluates the five route release gates.
 *
 * A route can only leave `gated` when every check passes. Failing gates
 * degrade to re-bundling, hub-tier fallback or cancellation with refund —
 * never to an unpriced release.
 */
export function evaluateRouteGate(input: GateInput): GateResult {
  const nMin = minimumHandovers(input.ledger, input.availablePerHandoverCents)
  const floor = priceFloorPerHandover(
    input.ledger,
    input.prepaidOrders,
    input.targetMarginCents ?? 0
  )
  const contribution = input.availablePerHandoverCents - floor

  const checks: GateCheck[] = [
    {
      id: 'density',
      label: 'Prepaid orders meet minimum density',
      passed: input.prepaidOrders >= nMin,
      detail: `${input.prepaidOrders} prepaid of ${Number.isFinite(nMin) ? nMin : '—'} required`,
    },
    {
      id: 'capacity',
      label: 'Cargo fits declared capacity',
      passed: input.cargoKg <= input.capacityKg,
      detail: `${input.cargoKg} kg of ${input.capacityKg} kg`,
    },
    {
      id: 'window',
      label: 'Delivery window and availability confirmed',
      passed: input.windowConfirmed,
      detail: input.windowConfirmed ? 'Hub and recipients confirmed' : 'Awaiting confirmation',
    },
    {
      id: 'floor',
      label: 'Revenue per handover clears the route floor',
      passed: Number.isFinite(floor) && contribution >= 0,
      detail: Number.isFinite(floor)
        ? `Floor ${formatCents(floor)} vs ${formatCents(input.availablePerHandoverCents)} available per handover`
        : 'No successful handovers projected',
    },
    {
      id: 'fallback',
      label: 'Fallback plan in place',
      passed: input.fallbackAvailable,
      detail: input.fallbackAvailable
        ? 'Hub collection fallback registered'
        : 'No fallback registered',
    },
  ]

  return {
    passed: checks.every((check) => check.passed),
    checks,
    minimumHandovers: nMin,
    floorCentsPerHandover: floor,
    contributionPerHandoverCents: contribution,
  }
}

/**
 * Classifies a computed floor against the published rapid-retail comparator
 * band (R37–R50) so no surface can market an exception route as ordinary
 * community delivery.
 */
export function floorPositioning(floorCents: Cents): {
  band: 'below_comparator' | 'scheduled_convenience' | 'exception'
  message: string
} {
  if (floorCents < 3700) {
    return {
      band: 'below_comparator',
      message: 'Below the R37–R50 rapid-retail comparator: a saving can be shown to members.',
    }
  }
  if (floorCents <= 9000) {
    return {
      band: 'scheduled_convenience',
      message:
        'Within R37–R90: viable as a scheduled convenience tier if basket saving is demonstrated.',
    }
  }
  return {
    band: 'exception',
    message:
      'Above R90: must be handled as a premium, cold-chain or partner-courier route, not ordinary community delivery.',
  }
}

export interface RunnerPayoutInput {
  baseCents: Cents
  /** Paid only for documented incremental weight carried. */
  weightKg: number
  weightRateCentsPerKg: Cents
  /** Paid only for documented incremental detour, not the whole trip. */
  incrementalKm: number
  distanceRateCentsPerKm: Cents
  /** Handovers completed beyond the break-even density. */
  clusterHandovers: number
  clusterRateCents: Cents
  /** Quality score in [0, 1] from on-time, accuracy and dispute history. */
  qualityScore: number
  qualityMaxCents: Cents
  /** Policy-approved premium for difficult or higher-risk routes. */
  riskPremiumCents: Cents
}

export interface PayoutComponent {
  id: string
  label: string
  amountCents: Cents
  basis: string
}

export interface RunnerPayoutResult {
  components: PayoutComponent[]
  totalCents: Cents
}

/**
 * Runner payout stack: base + weight + incremental distance + cluster +
 * quality + risk. Every component is shown to the runner before they accept,
 * and every component keys off a verified operational fact.
 */
export function runnerPayout(input: RunnerPayoutInput): RunnerPayoutResult {
  const components: PayoutComponent[] = [
    {
      id: 'base',
      label: 'Base route reward',
      amountCents: input.baseCents,
      basis: 'Accepted and completed verified route',
    },
    {
      id: 'weight',
      label: 'Incremental weight',
      amountCents: Math.round(input.weightKg * input.weightRateCentsPerKg),
      basis: `${input.weightKg} kg documented incremental load`,
    },
    {
      id: 'distance',
      label: 'Incremental distance',
      amountCents: Math.round(input.incrementalKm * input.distanceRateCentsPerKm),
      basis: `${input.incrementalKm} km detour beyond declared trip`,
    },
    {
      id: 'cluster',
      label: 'Cluster density reward',
      amountCents: input.clusterHandovers * input.clusterRateCents,
      basis: `${input.clusterHandovers} handovers past break-even density`,
    },
    {
      id: 'quality',
      label: 'Quality reward',
      amountCents: Math.round(clamp01(input.qualityScore) * input.qualityMaxCents),
      basis: `Reliability score ${(clamp01(input.qualityScore) * 100).toFixed(0)}%`,
    },
    {
      id: 'risk',
      label: 'Approved risk premium',
      amountCents: input.riskPremiumCents,
      basis: input.riskPremiumCents > 0 ? 'Policy-approved route premium' : 'Not applicable',
    },
  ]

  return {
    components,
    totalCents: components.reduce((sum, component) => sum + component.amountCents, 0),
  }
}

export interface DistributorPayoutInput {
  coordinationCents: Cents
  successfulHandovers: number
  perHandoverCents: Cents
  reliabilityBonusCents: Cents
  approvedRiskCents: Cents
  substantiatedClaimsCents: Cents
}

/**
 * Distributor payout stack. Claims are deducted only when substantiated and
 * never below zero: the model does not create punitive debt.
 */
export function distributorPayout(input: DistributorPayoutInput): RunnerPayoutResult {
  const components: PayoutComponent[] = [
    {
      id: 'coordination',
      label: 'Coordination',
      amountCents: input.coordinationCents,
      basis: 'Documented order aggregation work',
    },
    {
      id: 'handovers',
      label: 'Successful handovers',
      amountCents: input.successfulHandovers * input.perHandoverCents,
      basis: `${input.successfulHandovers} verified handovers`,
    },
    {
      id: 'reliability',
      label: 'Reliability bonus',
      amountCents: input.reliabilityBonusCents,
      basis: 'On-time, dispute-free performance',
    },
    {
      id: 'risk',
      label: 'Approved risk',
      amountCents: input.approvedRiskCents,
      basis: 'Policy-approved route difficulty',
    },
    {
      id: 'claims',
      label: 'Substantiated claims',
      amountCents: -input.substantiatedClaimsCents,
      basis: 'Resolved loss or damage outcomes',
    },
  ]

  const gross = components.reduce((sum, component) => sum + component.amountCents, 0)

  return { components, totalCents: Math.max(gross, 0) }
}

/**
 * Referral reward for a completed order by a referred participant.
 *
 * The signature admits a single beneficiary and a hard cap by design: there is
 * no downline parameter to pass, so a multi-tier plan cannot be expressed.
 */
export function referralReward(
  referredOrderValueCents: Cents,
  ratio: number,
  capCents: Cents,
  alreadyPaidCents: Cents
): Cents {
  const uncapped = Math.round(referredOrderValueCents * ratio)
  const remaining = Math.max(capCents - alreadyPaidCents, 0)
  return Math.min(uncapped, remaining)
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1)
}
