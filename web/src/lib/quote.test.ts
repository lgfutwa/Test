import { describe, expect, test } from 'bun:test'
import { findSku } from './data/catalogue'
import { poolCommittedUnits } from './data/cycles'
import { buildQuote, parseStockList, REVIEW_CONFIDENCE_THRESHOLD } from './quote'

describe('stock list parsing', () => {
  test('parses the canonical WhatsApp stock list', () => {
    const parsed = parseStockList('20 maize meal 10kg, 15 oil 2L, 30 sugar 2kg')

    expect(parsed).toHaveLength(3)
    expect(parsed[0]?.units).toBe(20)
    expect(parsed[0]?.skuId).toBe('sku_maize_10kg')
    expect(parsed[1]?.units).toBe(15)
    expect(parsed[1]?.skuId).toBe('sku_oil_2l')
    expect(parsed[2]?.units).toBe(30)
    expect(parsed[2]?.skuId).toBe('sku_sugar_2kg')
  })

  test('handles newline separated lists and multiplication signs', () => {
    const parsed = parseStockList('8 x rice 10kg\n6 washing powder 2kg')
    expect(parsed).toHaveLength(2)
    expect(parsed[0]?.units).toBe(8)
    expect(parsed[0]?.skuId).toBe('sku_rice_10kg')
    expect(parsed[1]?.skuId).toBe('sku_powder_2kg')
  })

  test('surfaces unmatched lines rather than dropping them', () => {
    const parsed = parseStockList('12 something we do not stock')
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.skuId).toBeNull()
    expect(parsed[0]?.confidence).toBe(0)
  })

  test('defaults to one unit when no quantity is given', () => {
    const parsed = parseStockList('maize meal 10kg')
    expect(parsed[0]?.units).toBe(1)
  })
})

describe('quote building', () => {
  test('applies the pooled tier while charging only the buyer units', () => {
    const quote = buildQuote([{ skuId: 'sku_maize_10kg', units: 20, supplierId: 'sup_boxer_bulk' }])
    const line = quote.lines[0]
    const pooled = 20 + (poolCommittedUnits.sku_maize_10kg ?? 0)

    expect(line?.pooledUnits).toBe(pooled)
    expect(line?.appliedUnitPriceCents).toBe(11_540)
    expect(line?.walkInUnitPriceCents).toBe(11_980)
    expect(line?.supplierCents).toBe(11_540 * 20)
  })

  test('totals reconcile: landed equals the sum of disclosed components', () => {
    const quote = buildQuote([
      { skuId: 'sku_maize_10kg', units: 20, supplierId: 'sup_boxer_bulk' },
      { skuId: 'sku_oil_2l', units: 15, supplierId: 'sup_boxer_bulk' },
      { skuId: 'sku_sugar_2kg', units: 30, supplierId: 'sup_boxer_bulk' },
    ])

    expect(quote.landedTotalCents).toBe(
      quote.supplierTotalCents +
        quote.logisticsTotalCents +
        quote.hubTotalCents +
        quote.platformTotalCents
    )
    expect(quote.savingTotalCents).toBe(quote.comparatorTotalCents - quote.landedTotalCents)
    expect(quote.savingTotalCents).toBeGreaterThan(0)
  })

  test('comparator uses the disclosed retail basis for each SKU', () => {
    const quote = buildQuote([{ skuId: 'sku_sugar_2kg', units: 10, supplierId: 'sup_boxer_bulk' }])
    const sku = findSku('sku_sugar_2kg')
    expect(quote.comparatorTotalCents).toBe((sku?.comparator.unitPriceCents ?? 0) * 10)
  })

  test('flags low-confidence lines for agent review', () => {
    const quote = buildQuote([
      {
        skuId: 'sku_maize_10kg',
        units: 5,
        supplierId: 'sup_boxer_bulk',
        confidence: REVIEW_CONFIDENCE_THRESHOLD - 0.05,
      },
    ])
    expect(quote.reviewRequired).toBe(true)
    expect(quote.lines[0]?.needsReview).toBe(true)
  })

  test('switching supplier changes the quote without changing the fee structure', () => {
    const boxer = buildQuote([{ skuId: 'sku_oil_2l', units: 12, supplierId: 'sup_boxer_bulk' }])
    const depot = buildQuote([{ skuId: 'sku_oil_2l', units: 12, supplierId: 'sup_kzn_depot' }])

    expect(boxer.supplierTotalCents).not.toBe(depot.supplierTotalCents)
    expect(boxer.logisticsTotalCents).toBe(depot.logisticsTotalCents)
    expect(boxer.hubTotalCents).toBe(depot.hubTotalCents)
  })

  test('ignores unknown SKUs and non-positive quantities', () => {
    const quote = buildQuote([
      { skuId: 'sku_does_not_exist', units: 4, supplierId: 'sup_boxer_bulk' },
      { skuId: 'sku_maize_10kg', units: 0, supplierId: 'sup_boxer_bulk' },
    ])
    expect(quote.lines).toHaveLength(0)
    expect(quote.landedTotalCents).toBe(0)
    expect(quote.savingRatio).toBe(0)
  })

  test('reports units needed for the next pooled tier', () => {
    const quote = buildQuote([{ skuId: 'sku_rice_10kg', units: 2, supplierId: 'sup_boxer_bulk' }])
    expect(quote.lines[0]?.nextTier?.unitsNeeded).toBe(2)
    expect(quote.lines[0]?.nextTier?.unitPriceCents).toBe(14_260)
  })
})
