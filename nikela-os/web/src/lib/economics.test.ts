import { describe, expect, test } from 'bun:test'
import {
  allocateSaving,
  distributorPayout,
  evaluateRouteGate,
  floorPositioning,
  landedCost,
  minimumHandovers,
  priceFloorPerHandover,
  referralReward,
  routeCostTotal,
  runnerPayout,
  selectTier,
  unitsToNextTier,
  verifiedSaving,
} from './economics'
import { formatCents, formatRand, splitByWeights } from './money'

const tiers = [
  { minUnits: 1, unitPriceCents: 12_999 },
  { minUnits: 20, unitPriceCents: 12_150 },
  { minUnits: 60, unitPriceCents: 11_600 },
]

describe('money', () => {
  test('formats cents with rand grouping', () => {
    expect(formatCents(0)).toBe('R0.00')
    expect(formatCents(12_999)).toBe('R129.99')
    expect(formatCents(1_234_567)).toBe('R12 345.67')
    expect(formatCents(-4550)).toBe('-R45.50')
    expect(formatCents(4550, { showSign: true })).toBe('+R45.50')
  })

  test('formats whole rand for summary tiles', () => {
    expect(formatRand(12_949)).toBe('R129')
    expect(formatRand(12_999)).toBe('R130')
  })

  test('largest-remainder split never loses or invents cents', () => {
    const parts = splitByWeights(1000, [1, 1, 1])
    expect(parts).toEqual([334, 333, 333])
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(1000)
  })

  test('split handles zero weights and zero totals', () => {
    expect(splitByWeights(500, [0, 0])).toEqual([0, 0])
    expect(splitByWeights(0, [3, 7])).toEqual([0, 0])
  })

  test('split is exact across many random cases', () => {
    for (let index = 0; index < 500; index += 1) {
      const total = Math.floor(Math.random() * 500_000)
      const weights = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ]
      const sum = splitByWeights(total, weights).reduce((acc, part) => acc + part, 0)
      expect(sum).toBe(weights.some((weight) => weight > 0) ? total : 0)
    }
  })
})

describe('landed cost and tiers', () => {
  test('selects the best qualifying tier', () => {
    expect(selectTier(1, tiers).unitPriceCents).toBe(12_999)
    expect(selectTier(19, tiers).unitPriceCents).toBe(12_999)
    expect(selectTier(20, tiers).unitPriceCents).toBe(12_150)
    expect(selectTier(120, tiers).unitPriceCents).toBe(11_600)
  })

  test('reports units required for the next tier', () => {
    const next = unitsToNextTier(18, tiers)
    expect(next?.unitsNeeded).toBe(2)
    expect(next?.tier.unitPriceCents).toBe(12_150)
    expect(unitsToNextTier(80, tiers)).toBeNull()
  })

  test('separates every fee component and sums to the total', () => {
    const result = landedCost({
      units: 20,
      tiers,
      logisticsPerUnitCents: 420,
      hubPerUnitCents: 180,
      platformFeeRatio: 0.025,
    })

    expect(result.appliedTier.unitPriceCents).toBe(12_150)
    expect(result.supplierCents).toBe(243_000)
    expect(result.logisticsCents).toBe(8400)
    expect(result.hubCents).toBe(3600)
    expect(result.platformCents).toBe(6075)
    expect(result.totalCents).toBe(243_000 + 8400 + 3600 + 6075)
  })

  test('verified saving can be negative and is not clamped', () => {
    const landed = {
      supplierCents: 100_000,
      logisticsCents: 5000,
      hubCents: 2000,
      platformCents: 2500,
    }
    expect(verifiedSaving(120_000, landed)).toBe(10_500)
    expect(verifiedSaving(100_000, landed)).toBe(-9500)
  })
})

describe('savings allocation', () => {
  test('respects member weights and reconciles exactly', () => {
    const allocated = allocateSaving(10_501, {
      immediateDiscount: 50,
      personalSavings: 30,
      emergencyBuffer: 10,
      communityInvestment: 10,
    })

    const sum =
      allocated.immediateDiscountCents +
      allocated.personalSavingsCents +
      allocated.emergencyBufferCents +
      allocated.communityInvestmentCents
    expect(sum).toBe(10_501)
    expect(allocated.immediateDiscountCents).toBeGreaterThan(allocated.personalSavingsCents)
  })

  test('never funds group buckets without a member weight', () => {
    const allocated = allocateSaving(9000, {
      immediateDiscount: 100,
      personalSavings: 0,
      emergencyBuffer: 0,
      communityInvestment: 0,
    })
    expect(allocated.emergencyBufferCents).toBe(0)
    expect(allocated.communityInvestmentCents).toBe(0)
    expect(allocated.immediateDiscountCents).toBe(9000)
  })

  test('negative savings allocate nothing rather than debiting a member', () => {
    const allocated = allocateSaving(-5000, {
      immediateDiscount: 1,
      personalSavings: 1,
      emergencyBuffer: 0,
      communityInvestment: 0,
    })
    expect(allocated.immediateDiscountCents).toBe(0)
    expect(allocated.personalSavingsCents).toBe(0)
  })
})

describe('route economics', () => {
  const ledger = {
    labourCents: 18_000,
    fuelVehicleCents: 9500,
    hubCents: 4000,
    riskCents: 3500,
    platformCents: 2000,
  }

  test('sums the five protected cost pools', () => {
    expect(routeCostTotal(ledger)).toBe(37_000)
  })

  test('price floor divides by successful handovers, not orders', () => {
    expect(priceFloorPerHandover(ledger, 10)).toBe(3700)
    expect(priceFloorPerHandover(ledger, 7)).toBe(5286)
    expect(priceFloorPerHandover(ledger, 0)).toBe(Number.POSITIVE_INFINITY)
  })

  test('minimum handovers rounds up', () => {
    expect(minimumHandovers(ledger, 4000)).toBe(10)
    expect(minimumHandovers(ledger, 4500)).toBe(9)
    expect(minimumHandovers(ledger, 0)).toBe(Number.POSITIVE_INFINITY)
  })

  test('gate passes only when all five checks pass', () => {
    const result = evaluateRouteGate({
      ledger,
      prepaidOrders: 12,
      availablePerHandoverCents: 4000,
      cargoKg: 48,
      capacityKg: 65,
      windowConfirmed: true,
      fallbackAvailable: true,
    })

    expect(result.passed).toBe(true)
    expect(result.minimumHandovers).toBe(10)
    expect(result.checks).toHaveLength(5)
    expect(result.contributionPerHandoverCents).toBeGreaterThanOrEqual(0)
  })

  test('gate fails on density and names the failing check', () => {
    const result = evaluateRouteGate({
      ledger,
      prepaidOrders: 6,
      availablePerHandoverCents: 4000,
      cargoKg: 30,
      capacityKg: 65,
      windowConfirmed: true,
      fallbackAvailable: true,
    })

    expect(result.passed).toBe(false)
    expect(result.checks.find((check) => check.id === 'density')?.passed).toBe(false)
    expect(result.checks.find((check) => check.id === 'capacity')?.passed).toBe(true)
    expect(result.checks.find((check) => check.id === 'density')?.detail).toBe(
      '6 prepaid of 10 required'
    )
  })

  test('gate fails when cargo exceeds declared capacity', () => {
    const result = evaluateRouteGate({
      ledger,
      prepaidOrders: 12,
      availablePerHandoverCents: 4000,
      cargoKg: 80,
      capacityKg: 65,
      windowConfirmed: true,
      fallbackAvailable: true,
    })
    expect(result.passed).toBe(false)
    expect(result.checks.find((check) => check.id === 'capacity')?.passed).toBe(false)
  })

  test('gate fails without a fallback plan', () => {
    const result = evaluateRouteGate({
      ledger,
      prepaidOrders: 12,
      availablePerHandoverCents: 4000,
      cargoKg: 30,
      capacityKg: 65,
      windowConfirmed: true,
      fallbackAvailable: false,
    })
    expect(result.passed).toBe(false)
    expect(result.checks.find((check) => check.id === 'fallback')?.passed).toBe(false)
  })

  test('floor positioning follows the published comparator bands', () => {
    expect(floorPositioning(3200).band).toBe('below_comparator')
    expect(floorPositioning(3700).band).toBe('scheduled_convenience')
    expect(floorPositioning(8999).band).toBe('scheduled_convenience')
    expect(floorPositioning(9001).band).toBe('exception')
  })
})

describe('compensation', () => {
  test('runner payout exposes every component and sums correctly', () => {
    const result = runnerPayout({
      baseCents: 6000,
      weightKg: 40,
      weightRateCentsPerKg: 25,
      incrementalKm: 6,
      distanceRateCentsPerKm: 380,
      clusterHandovers: 3,
      clusterRateCents: 900,
      qualityScore: 0.92,
      qualityMaxCents: 2500,
      riskPremiumCents: 1500,
    })

    expect(result.components).toHaveLength(6)
    expect(result.totalCents).toBe(6000 + 1000 + 2280 + 2700 + 2300 + 1500)
  })

  test('quality score is clamped to the unit interval', () => {
    const high = runnerPayout({
      baseCents: 0,
      weightKg: 0,
      weightRateCentsPerKg: 0,
      incrementalKm: 0,
      distanceRateCentsPerKm: 0,
      clusterHandovers: 0,
      clusterRateCents: 0,
      qualityScore: 4,
      qualityMaxCents: 2000,
      riskPremiumCents: 0,
    })
    expect(high.totalCents).toBe(2000)
  })

  test('distributor claims never create punitive debt', () => {
    const result = distributorPayout({
      coordinationCents: 4000,
      successfulHandovers: 8,
      perHandoverCents: 700,
      reliabilityBonusCents: 1500,
      approvedRiskCents: 0,
      substantiatedClaimsCents: 90_000,
    })
    expect(result.totalCents).toBe(0)
  })

  test('referral reward is single-tier and capped', () => {
    expect(referralReward(120_000, 0.01, 5000, 0)).toBe(1200)
    expect(referralReward(2_000_000, 0.01, 5000, 0)).toBe(5000)
    expect(referralReward(120_000, 0.01, 5000, 4500)).toBe(500)
    expect(referralReward(120_000, 0.01, 5000, 5000)).toBe(0)
  })
})
