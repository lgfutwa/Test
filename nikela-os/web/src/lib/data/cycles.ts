import type { Cents } from '../money'

export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'confirmed'
  | 'pooled'
  | 'locked'
  | 'procured'
  | 'at_hub'
  | 'fulfilled'
  | 'exception'
  | 'reconciled'

export interface CycleSummary {
  id: string
  zoneId: string
  groupName: string
  opensAt: string
  locksAt: string
  status: 'open' | 'locking' | 'locked' | 'po_placed' | 'receiving' | 'reconciling' | 'closed'
  participatingHouseholds: number
  participatingShops: number
  committedValueCents: Cents
  hubId: string
}

export interface OrderSummary {
  id: string
  orderRef: string
  buyerName: string
  kind: 'household' | 'spaza_procurement'
  zoneId: string
  channelOrigin: 'whatsapp' | 'app' | 'pwa' | 'ops_desk'
  status: OrderStatus
  lineCount: number
  quotedTotalCents: Cents
  comparatorTotalCents: Cents
  paymentState: 'unpaid' | 'pending' | 'settled'
  hubId: string
  collectionPin?: string
  needsReview?: boolean
}

export const currentCycle: CycleSummary = {
  id: 'cyc_2026w32_khay',
  zoneId: 'zone_khayelitsha',
  groupName: 'Site C Household Buying Group',
  opensAt: 'Mon 04 Aug 06:00',
  locksAt: 'Tue 05 Aug 18:00',
  status: 'open',
  participatingHouseholds: 34,
  participatingShops: 9,
  committedValueCents: 6_842_500,
  hubId: 'hub_sibongile',
}

/**
 * Units already committed to the open cycle by other members and shops.
 *
 * A single shop rarely reaches a wholesale price break alone; the pool is what
 * lifts its order into a cheaper tier, so quotes are always computed against
 * pooled volume while the shop pays only for its own units.
 */
export const poolCommittedUnits: Record<string, number> = {
  sku_maize_10kg: 44,
  sku_oil_2l: 31,
  sku_sugar_2kg: 68,
  sku_rice_10kg: 12,
  sku_flour_125kg: 7,
  sku_milk_1l_6: 19,
  sku_soap_500g: 40,
  sku_powder_2kg: 21,
}

export const orderDesk: OrderSummary[] = [
  {
    id: 'ord_1',
    orderRef: 'NK-7F3K2',
    buyerName: 'Ndlovu General Dealer',
    kind: 'spaza_procurement',
    zoneId: 'zone_khayelitsha',
    channelOrigin: 'whatsapp',
    status: 'locked',
    lineCount: 6,
    quotedTotalCents: 1_284_600,
    comparatorTotalCents: 1_402_300,
    paymentState: 'settled',
    hubId: 'hub_sibongile',
  },
  {
    id: 'ord_2',
    orderRef: 'NK-9QM41',
    buyerName: 'Thandi Mkhize',
    kind: 'household',
    zoneId: 'zone_khayelitsha',
    channelOrigin: 'pwa',
    status: 'at_hub',
    lineCount: 4,
    quotedTotalCents: 47_820,
    comparatorTotalCents: 53_960,
    paymentState: 'settled',
    hubId: 'hub_sibongile',
    collectionPin: '4192',
  },
  {
    id: 'ord_3',
    orderRef: 'NK-2LX88',
    buyerName: 'Mthembu Tuck Shop',
    kind: 'spaza_procurement',
    zoneId: 'zone_umlazi',
    channelOrigin: 'whatsapp',
    status: 'quoted',
    lineCount: 5,
    quotedTotalCents: 862_400,
    comparatorTotalCents: 931_700,
    paymentState: 'unpaid',
    hubId: 'hub_mthembu',
    needsReview: true,
  },
  {
    id: 'ord_4',
    orderRef: 'NK-5TB09',
    buyerName: 'Zanele Khumalo',
    kind: 'household',
    zoneId: 'zone_khayelitsha',
    channelOrigin: 'whatsapp',
    status: 'pooled',
    lineCount: 3,
    quotedTotalCents: 33_140,
    comparatorTotalCents: 37_480,
    paymentState: 'pending',
    hubId: 'hub_ilitha',
  },
  {
    id: 'ord_5',
    orderRef: 'NK-8HD73',
    buyerName: 'Sibongile Spaza',
    kind: 'spaza_procurement',
    zoneId: 'zone_khayelitsha',
    channelOrigin: 'app',
    status: 'reconciled',
    lineCount: 9,
    quotedTotalCents: 2_146_900,
    comparatorTotalCents: 2_388_400,
    paymentState: 'settled',
    hubId: 'hub_sibongile',
  },
  {
    id: 'ord_6',
    orderRef: 'NK-3VC26',
    buyerName: 'Nolwazi Sithole',
    kind: 'household',
    zoneId: 'zone_khayelitsha',
    channelOrigin: 'ops_desk',
    status: 'exception',
    lineCount: 2,
    quotedTotalCents: 21_780,
    comparatorTotalCents: 24_050,
    paymentState: 'settled',
    hubId: 'hub_ilitha',
  },
]

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: 'Draft',
  quoted: 'Quoted',
  confirmed: 'Confirmed',
  pooled: 'Pooled',
  locked: 'Locked',
  procured: 'Procured',
  at_hub: 'At hub',
  fulfilled: 'Fulfilled',
  exception: 'Exception',
  reconciled: 'Reconciled',
}

/** Expected deliveries a hub operator scans in for the current cycle. */
export interface HubExpectedLine {
  id: string
  orderRef: string
  buyerName: string
  skuName: string
  packSize: string
  expectedUnits: number
  scannedUnits: number
  status: 'awaiting' | 'received' | 'short' | 'damaged'
}

export const hubExpectedLines: HubExpectedLine[] = [
  {
    id: 'hl_1',
    orderRef: 'NK-9QM41',
    buyerName: 'Thandi Mkhize',
    skuName: 'Super maize meal',
    packSize: '10 kg',
    expectedUnits: 2,
    scannedUnits: 0,
    status: 'awaiting',
  },
  {
    id: 'hl_2',
    orderRef: 'NK-9QM41',
    buyerName: 'Thandi Mkhize',
    skuName: 'Sunflower cooking oil',
    packSize: '2 L',
    expectedUnits: 2,
    scannedUnits: 0,
    status: 'awaiting',
  },
  {
    id: 'hl_3',
    orderRef: 'NK-5TB09',
    buyerName: 'Zanele Khumalo',
    skuName: 'White sugar',
    packSize: '2 kg',
    expectedUnits: 3,
    scannedUnits: 0,
    status: 'awaiting',
  },
  {
    id: 'hl_4',
    orderRef: 'NK-7F3K2',
    buyerName: 'Ndlovu General Dealer',
    skuName: 'Long grain rice',
    packSize: '10 kg',
    expectedUnits: 8,
    scannedUnits: 0,
    status: 'awaiting',
  },
  {
    id: 'hl_5',
    orderRef: 'NK-7F3K2',
    buyerName: 'Ndlovu General Dealer',
    skuName: 'Washing powder',
    packSize: '2 kg',
    expectedUnits: 6,
    scannedUnits: 0,
    status: 'awaiting',
  },
]

/** Collection queue: orders at the hub awaiting a PIN-verified handover. */
export interface HubCollection {
  id: string
  orderRef: string
  buyerName: string
  units: number
  /** Never shown to the operator; entered by the collector and verified. */
  pin: string
  windowClosesAt: string
  status: 'awaiting_collection' | 'verified' | 'window_expired'
}

export const hubCollections: HubCollection[] = [
  {
    id: 'hc_1',
    orderRef: 'NK-9QM41',
    buyerName: 'Thandi Mkhize',
    units: 4,
    pin: '4192',
    windowClosesAt: 'Sat 18:00',
    status: 'awaiting_collection',
  },
  {
    id: 'hc_2',
    orderRef: 'NK-5TB09',
    buyerName: 'Zanele Khumalo',
    units: 3,
    pin: '7735',
    windowClosesAt: 'Sat 18:00',
    status: 'awaiting_collection',
  },
  {
    id: 'hc_3',
    orderRef: 'NK-3VC26',
    buyerName: 'Nolwazi Sithole',
    units: 2,
    pin: '2048',
    windowClosesAt: 'Thu 18:00',
    status: 'window_expired',
  },
]
