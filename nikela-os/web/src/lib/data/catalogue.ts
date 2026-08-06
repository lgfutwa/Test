import type { PriceTier } from '../economics'
import type { Cents } from '../money'

export interface Supplier {
  id: string
  name: string
  kind: 'trader_bulk' | 'cash_and_carry' | 'distributor'
  note: string
}

export interface Sku {
  id: string
  name: string
  packSize: string
  category: string
  barcode: string
  ambient: boolean
  /** Disclosed retail comparator with the basis on which it was captured. */
  comparator: {
    retailer: string
    capturedOn: string
    unitPriceCents: Cents
  }
  offers: Array<{
    supplierId: string
    tiers: PriceTier[]
    moqUnits: number
  }>
}

export const suppliers: Supplier[] = [
  {
    id: 'sup_boxer_bulk',
    name: 'Boxer Bulk Online',
    kind: 'trader_bulk',
    note: 'Trader and spaza bulk platform; collection from regional points',
  },
  {
    id: 'sup_regional_cc',
    name: 'Regional Cash & Carry',
    kind: 'cash_and_carry',
    note: 'Comparison supplier held on record every cycle',
  },
  {
    id: 'sup_kzn_depot',
    name: 'Umlazi Wholesale Depot',
    kind: 'distributor',
    note: 'Scheduled regional delivery for high-turn staples',
  },
]

/**
 * Launch catalogue: ambient, high-turn staples only.
 *
 * Perishables are deliberately absent until a zone clears the cold-chain
 * entry criteria (equipment, certified runners, temperature SOPs).
 */
export const catalogue: Sku[] = [
  {
    id: 'sku_maize_10kg',
    name: 'Super maize meal',
    packSize: '10 kg',
    category: 'Maize meal',
    barcode: '6001234500017',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 12_999,
    },
    offers: [
      {
        supplierId: 'sup_boxer_bulk',
        moqUnits: 10,
        tiers: [
          { minUnits: 1, unitPriceCents: 12_450 },
          { minUnits: 20, unitPriceCents: 11_980 },
          { minUnits: 60, unitPriceCents: 11_540 },
        ],
      },
      {
        supplierId: 'sup_regional_cc',
        moqUnits: 5,
        tiers: [
          { minUnits: 1, unitPriceCents: 12_720 },
          { minUnits: 24, unitPriceCents: 12_310 },
        ],
      },
    ],
  },
  {
    id: 'sku_oil_2l',
    name: 'Sunflower cooking oil',
    packSize: '2 L',
    category: 'Cooking oil',
    barcode: '6001234500024',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 6499,
    },
    offers: [
      {
        supplierId: 'sup_boxer_bulk',
        moqUnits: 6,
        tiers: [
          { minUnits: 1, unitPriceCents: 6180 },
          { minUnits: 12, unitPriceCents: 5940 },
          { minUnits: 48, unitPriceCents: 5720 },
        ],
      },
      {
        supplierId: 'sup_kzn_depot',
        moqUnits: 12,
        tiers: [
          { minUnits: 1, unitPriceCents: 6250 },
          { minUnits: 36, unitPriceCents: 5860 },
        ],
      },
    ],
  },
  {
    id: 'sku_sugar_2kg',
    name: 'White sugar',
    packSize: '2 kg',
    category: 'Sugar',
    barcode: '6001234500031',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 4599,
    },
    offers: [
      {
        supplierId: 'sup_boxer_bulk',
        moqUnits: 10,
        tiers: [
          { minUnits: 1, unitPriceCents: 4380 },
          { minUnits: 30, unitPriceCents: 4190 },
          { minUnits: 90, unitPriceCents: 4020 },
        ],
      },
      {
        supplierId: 'sup_regional_cc',
        moqUnits: 10,
        tiers: [{ minUnits: 1, unitPriceCents: 4460 }],
      },
    ],
  },
  {
    id: 'sku_rice_10kg',
    name: 'Long grain rice',
    packSize: '10 kg',
    category: 'Rice',
    barcode: '6001234500048',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 15_499,
    },
    offers: [
      {
        supplierId: 'sup_boxer_bulk',
        moqUnits: 5,
        tiers: [
          { minUnits: 1, unitPriceCents: 14_820 },
          { minUnits: 16, unitPriceCents: 14_260 },
          { minUnits: 40, unitPriceCents: 13_890 },
        ],
      },
    ],
  },
  {
    id: 'sku_flour_125kg',
    name: 'Cake flour',
    packSize: '12.5 kg',
    category: 'Flour',
    barcode: '6001234500055',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 17_299,
    },
    offers: [
      {
        supplierId: 'sup_boxer_bulk',
        moqUnits: 4,
        tiers: [
          { minUnits: 1, unitPriceCents: 16_540 },
          { minUnits: 12, unitPriceCents: 15_980 },
        ],
      },
    ],
  },
  {
    id: 'sku_milk_1l_6',
    name: 'Long-life milk',
    packSize: '6 x 1 L',
    category: 'Long-life milk',
    barcode: '6001234500062',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 10_799,
    },
    offers: [
      {
        supplierId: 'sup_kzn_depot',
        moqUnits: 6,
        tiers: [
          { minUnits: 1, unitPriceCents: 10_320 },
          { minUnits: 24, unitPriceCents: 9880 },
        ],
      },
    ],
  },
  {
    id: 'sku_soap_500g',
    name: 'Bar soap',
    packSize: '500 g',
    category: 'Soap and detergents',
    barcode: '6001234500079',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 2199,
    },
    offers: [
      {
        supplierId: 'sup_boxer_bulk',
        moqUnits: 12,
        tiers: [
          { minUnits: 1, unitPriceCents: 2040 },
          { minUnits: 48, unitPriceCents: 1930 },
        ],
      },
    ],
  },
  {
    id: 'sku_powder_2kg',
    name: 'Washing powder',
    packSize: '2 kg',
    category: 'Soap and detergents',
    barcode: '6001234500086',
    ambient: true,
    comparator: {
      retailer: 'Local wholesaler walk-in',
      capturedOn: '2026-08-03',
      unitPriceCents: 5899,
    },
    offers: [
      {
        supplierId: 'sup_regional_cc',
        moqUnits: 6,
        tiers: [
          { minUnits: 1, unitPriceCents: 5620 },
          { minUnits: 24, unitPriceCents: 5390 },
        ],
      },
    ],
  },
]

/** Approximate shipping weight per unit, used by route capacity checks. */
export const skuWeightKg: Record<string, number> = {
  sku_maize_10kg: 10,
  sku_oil_2l: 1.9,
  sku_sugar_2kg: 2,
  sku_rice_10kg: 10,
  sku_flour_125kg: 12.5,
  sku_milk_1l_6: 6.2,
  sku_soap_500g: 0.5,
  sku_powder_2kg: 2,
}

/** Fee policy per zone service tier, expressed per unit where applicable. */
export const feePolicy = {
  logisticsPerUnitCents: 340,
  hubPerUnitCents: 150,
  platformFeeRatio: 0.025,
} as const

export function findSku(skuId: string): Sku | undefined {
  return catalogue.find((sku) => sku.id === skuId)
}

export function findSupplier(supplierId: string): Supplier | undefined {
  return suppliers.find((supplier) => supplier.id === supplierId)
}

/**
 * Matches a free-text or voice-note line to a catalogue SKU.
 *
 * This mirrors the parsing service contract: the front end shows the candidate
 * with a confidence score, and a low score routes the line to an agent rather
 * than silently guessing.
 */
export function matchSkuFromText(text: string): { sku: Sku; confidence: number } | null {
  const normalised = text.toLowerCase()
  const scored = catalogue
    .map((sku) => {
      const tokens = `${sku.name} ${sku.category} ${sku.packSize}`.toLowerCase().split(/[\s/]+/)
      const hits = tokens.filter((token) => token.length > 2 && normalised.includes(token)).length
      const packHit = normalised
        .replace(/\s/g, '')
        .includes(sku.packSize.replace(/\s/g, '').toLowerCase())
      return { sku, score: hits + (packHit ? 1.5 : 0) }
    })
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score <= 0) {
    return null
  }
  return { sku: best.sku, confidence: Math.min(0.55 + best.score * 0.12, 0.98) }
}
