import { feePolicy, findSku, matchSkuFromText, type Sku } from './data/catalogue'
import { poolCommittedUnits } from './data/cycles'
import { landedCost, selectTier, unitsToNextTier, verifiedSaving } from './economics'
import type { Cents } from './money'

export interface QuoteLineInput {
  skuId: string
  units: number
  supplierId: string
  /** Parser confidence when the line came from free text or a voice note. */
  confidence?: number
}

export interface QuoteLine {
  skuId: string
  sku: Sku
  units: number
  supplierId: string
  confidence?: number
  pooledUnits: number
  appliedUnitPriceCents: Cents
  walkInUnitPriceCents: Cents
  comparatorCents: Cents
  supplierCents: Cents
  logisticsCents: Cents
  hubCents: Cents
  platformCents: Cents
  landedTotalCents: Cents
  savingCents: Cents
  nextTier: { unitsNeeded: number; unitPriceCents: Cents } | null
  /** True when the line needs an agent to confirm the SKU match. */
  needsReview: boolean
}

export interface Quote {
  lines: QuoteLine[]
  comparatorTotalCents: Cents
  supplierTotalCents: Cents
  logisticsTotalCents: Cents
  hubTotalCents: Cents
  platformTotalCents: Cents
  landedTotalCents: Cents
  savingTotalCents: Cents
  savingRatio: number
  reviewRequired: boolean
}

/** Confidence below this threshold routes a parsed line to an agent. */
export const REVIEW_CONFIDENCE_THRESHOLD = 0.7

/**
 * Builds a quote with every fee separated and the pooled tier applied.
 *
 * The buyer pays for their own units, but the price tier is selected on pooled
 * cycle volume: that is the mechanism the whole platform exists to provide.
 */
export function buildQuote(inputs: readonly QuoteLineInput[]): Quote {
  const lines: QuoteLine[] = []

  for (const input of inputs) {
    const sku = findSku(input.skuId)
    if (!sku || input.units <= 0) {
      continue
    }
    const offer =
      sku.offers.find((candidate) => candidate.supplierId === input.supplierId) ?? sku.offers[0]
    if (!offer) {
      continue
    }

    const pooledUnits = input.units + (poolCommittedUnits[sku.id] ?? 0)
    const pooledTier = selectTier(pooledUnits, offer.tiers)
    const landed = landedCost({
      units: input.units,
      tiers: [{ minUnits: 1, unitPriceCents: pooledTier.unitPriceCents }],
      logisticsPerUnitCents: feePolicy.logisticsPerUnitCents,
      hubPerUnitCents: feePolicy.hubPerUnitCents,
      platformFeeRatio: feePolicy.platformFeeRatio,
    })
    const comparatorCents = sku.comparator.unitPriceCents * input.units
    const nextTierInfo = unitsToNextTier(pooledUnits, offer.tiers)

    lines.push({
      skuId: sku.id,
      sku,
      units: input.units,
      supplierId: offer.supplierId,
      confidence: input.confidence,
      pooledUnits,
      appliedUnitPriceCents: pooledTier.unitPriceCents,
      walkInUnitPriceCents: selectTier(input.units, offer.tiers).unitPriceCents,
      comparatorCents,
      supplierCents: landed.supplierCents,
      logisticsCents: landed.logisticsCents,
      hubCents: landed.hubCents,
      platformCents: landed.platformCents,
      landedTotalCents: landed.totalCents,
      savingCents: verifiedSaving(comparatorCents, landed),
      nextTier: nextTierInfo
        ? {
            unitsNeeded: nextTierInfo.unitsNeeded,
            unitPriceCents: nextTierInfo.tier.unitPriceCents,
          }
        : null,
      needsReview: input.confidence !== undefined && input.confidence < REVIEW_CONFIDENCE_THRESHOLD,
    })
  }

  const totals = lines.reduce(
    (accumulator, line) => ({
      comparator: accumulator.comparator + line.comparatorCents,
      supplier: accumulator.supplier + line.supplierCents,
      logistics: accumulator.logistics + line.logisticsCents,
      hub: accumulator.hub + line.hubCents,
      platform: accumulator.platform + line.platformCents,
      landed: accumulator.landed + line.landedTotalCents,
      saving: accumulator.saving + line.savingCents,
    }),
    { comparator: 0, supplier: 0, logistics: 0, hub: 0, platform: 0, landed: 0, saving: 0 }
  )

  return {
    lines,
    comparatorTotalCents: totals.comparator,
    supplierTotalCents: totals.supplier,
    logisticsTotalCents: totals.logistics,
    hubTotalCents: totals.hub,
    platformTotalCents: totals.platform,
    landedTotalCents: totals.landed,
    savingTotalCents: totals.saving,
    savingRatio: totals.comparator > 0 ? totals.saving / totals.comparator : 0,
    reviewRequired: lines.some((line) => line.needsReview),
  }
}

export interface ParsedStockLine {
  raw: string
  units: number
  skuId: string | null
  skuName: string
  confidence: number
}

/**
 * Parses a free-text or transcribed stock list into candidate lines.
 *
 * Mirrors the channels-worker contract: a parse never becomes an order by
 * itself. Unmatched or low-confidence lines surface for agent review instead of
 * being silently dropped or guessed.
 */
export function parseStockList(text: string): ParsedStockLine[] {
  return text
    .split(/[\n,;]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const quantityMatch = segment.match(/^(\d+)\s*(?:x|×)?\s*/)
      const units = quantityMatch?.[1] ? Number.parseInt(quantityMatch[1], 10) : 1
      const descriptor = segment.replace(/^\s*\d+\s*(?:x|×)?\s*/, '')
      const match = matchLine(descriptor)

      return {
        raw: segment,
        units,
        skuId: match?.skuId ?? null,
        skuName: match?.skuName ?? descriptor,
        confidence: match?.confidence ?? 0,
      }
    })
}

function matchLine(
  descriptor: string
): { skuId: string; skuName: string; confidence: number } | null {
  const match = matchSkuFromText(descriptor)
  if (!match) {
    return null
  }
  return {
    skuId: match.sku.id,
    skuName: `${match.sku.name} ${match.sku.packSize}`,
    confidence: match.confidence,
  }
}
