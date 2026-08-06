import type { RouteCostLedger, ServiceTier } from '../economics'
import type { Cents } from '../money'

export interface Zone {
  id: string
  name: string
  region: string
  /** Doorstep delivery is an earned tier, enabled per zone by handover history. */
  doorstepEnabled: boolean
  coldChainEnabled: boolean
  riskClass: 'standard' | 'elevated' | 'high'
  serviceWindow: string
  cycleCadence: string
}

export interface Hub {
  id: string
  name: string
  zoneId: string
  kind: 'spaza' | 'community_hall' | 'church' | 'school'
  operatingHours: string
  maxStockValueCents: Cents
  coldCapable: boolean
  reliabilityScore: number
  shrinkageRate: number
}

export interface RunnerProfile {
  id: string
  name: string
  zoneId: string
  kycTier: 't1_identity' | 't2_enhanced'
  reliabilityScore: number
  vehicle: 'walk' | 'taxi' | 'car' | 'bakkie'
  capacityKg: number
  coldChainCertified: boolean
  completedRoutes: number
}

export interface ShopProfile {
  id: string
  name: string
  ownerName: string
  zoneId: string
  cyclesCompleted: number
  cyclesWindowDays: number
  recurringSkus: number
  monthlyVolumeCents: Cents
  appInvited: boolean
  isHub: boolean
}

export interface RouteCandidate {
  id: string
  label: string
  zoneId: string
  tier: ServiceTier
  hubId: string
  departsAt: string
  ledger: RouteCostLedger
  prepaidOrders: number
  confirmedOrders: number
  availablePerHandoverCents: Cents
  cargoKg: number
  capacityKg: number
  windowConfirmed: boolean
  fallbackAvailable: boolean
  runnerId: string
  incrementalKm: number
  stops: number
}

export const zones: Zone[] = [
  {
    id: 'zone_khayelitsha',
    name: 'Khayelitsha Site C',
    region: 'Cape Town',
    doorstepEnabled: false,
    coldChainEnabled: false,
    riskClass: 'elevated',
    serviceWindow: 'Thu 10:00–13:00',
    cycleCadence: 'Weekly',
  },
  {
    id: 'zone_umlazi',
    name: 'Umlazi Section D',
    region: 'KwaZulu-Natal',
    doorstepEnabled: true,
    coldChainEnabled: false,
    riskClass: 'standard',
    serviceWindow: 'Wed 09:00–12:00',
    cycleCadence: 'Weekly',
  },
  {
    id: 'zone_orlando',
    name: 'Orlando East',
    region: 'Gauteng',
    doorstepEnabled: false,
    coldChainEnabled: false,
    riskClass: 'high',
    serviceWindow: 'Fri 09:00–12:00',
    cycleCadence: 'Fortnightly',
  },
]

export const hubs: Hub[] = [
  {
    id: 'hub_sibongile',
    name: 'Sibongile Spaza — Site C',
    zoneId: 'zone_khayelitsha',
    kind: 'spaza',
    operatingHours: 'Mon–Sat 07:00–19:00',
    maxStockValueCents: 1_800_000,
    coldCapable: false,
    reliabilityScore: 0.96,
    shrinkageRate: 0.004,
  },
  {
    id: 'hub_ilitha',
    name: 'Ilitha Community Hall',
    zoneId: 'zone_khayelitsha',
    kind: 'community_hall',
    operatingHours: 'Mon–Fri 08:00–17:00',
    maxStockValueCents: 900_000,
    coldCapable: false,
    reliabilityScore: 0.91,
    shrinkageRate: 0.009,
  },
  {
    id: 'hub_mthembu',
    name: 'Mthembu Tuck Shop — Section D',
    zoneId: 'zone_umlazi',
    kind: 'spaza',
    operatingHours: 'Mon–Sun 06:30–20:00',
    maxStockValueCents: 1_400_000,
    coldCapable: true,
    reliabilityScore: 0.94,
    shrinkageRate: 0.006,
  },
]

export const runners: RunnerProfile[] = [
  {
    id: 'run_nomsa',
    name: 'Nomsa Dlamini',
    zoneId: 'zone_khayelitsha',
    kycTier: 't2_enhanced',
    reliabilityScore: 0.94,
    vehicle: 'taxi',
    capacityKg: 65,
    coldChainCertified: false,
    completedRoutes: 47,
  },
  {
    id: 'run_lungile',
    name: 'Lungile Mabaso',
    zoneId: 'zone_umlazi',
    kycTier: 't2_enhanced',
    reliabilityScore: 0.88,
    vehicle: 'bakkie',
    capacityKg: 400,
    coldChainCertified: true,
    completedRoutes: 23,
  },
]

export const shops: ShopProfile[] = [
  {
    id: 'shop_ndlovu',
    name: 'Ndlovu General Dealer',
    ownerName: 'Sipho Ndlovu',
    zoneId: 'zone_khayelitsha',
    cyclesCompleted: 3,
    cyclesWindowDays: 54,
    recurringSkus: 31,
    monthlyVolumeCents: 4_820_000,
    appInvited: false,
    isHub: false,
  },
  {
    id: 'shop_sibongile',
    name: 'Sibongile Spaza',
    ownerName: 'Sibongile Nkosi',
    zoneId: 'zone_khayelitsha',
    cyclesCompleted: 7,
    cyclesWindowDays: 60,
    recurringSkus: 44,
    monthlyVolumeCents: 7_150_000,
    appInvited: true,
    isHub: true,
  },
  {
    id: 'shop_mthembu',
    name: 'Mthembu Tuck Shop',
    ownerName: 'Bongani Mthembu',
    zoneId: 'zone_umlazi',
    cyclesCompleted: 2,
    cyclesWindowDays: 41,
    recurringSkus: 18,
    monthlyVolumeCents: 2_310_000,
    appInvited: false,
    isHub: true,
  },
]

/**
 * Candidate routes awaiting gate evaluation.
 *
 * The first clears its gate, the second is short on prepaid density, and the
 * third is an exception route whose floor sits above the R90 band — together
 * they exercise every branch of the release logic.
 */
export const routeCandidates: RouteCandidate[] = [
  {
    id: 'route_khay_thu',
    label: 'Bellville wholesale → Site C hub',
    zoneId: 'zone_khayelitsha',
    tier: 'existing_trip',
    hubId: 'hub_sibongile',
    departsAt: 'Thu 09:30',
    ledger: {
      labourCents: 16_500,
      fuelVehicleCents: 8200,
      hubCents: 4200,
      riskCents: 3100,
      platformCents: 1900,
    },
    prepaidOrders: 14,
    confirmedOrders: 17,
    availablePerHandoverCents: 3400,
    cargoKg: 58,
    capacityKg: 65,
    windowConfirmed: true,
    fallbackAvailable: true,
    runnerId: 'run_nomsa',
    incrementalKm: 5.4,
    stops: 1,
  },
  {
    id: 'route_umlazi_cluster',
    label: 'Section D clustered neighbourhood drop',
    zoneId: 'zone_umlazi',
    tier: 'cluster_drop',
    hubId: 'hub_mthembu',
    departsAt: 'Wed 10:00',
    ledger: {
      labourCents: 21_000,
      fuelVehicleCents: 11_400,
      hubCents: 3800,
      riskCents: 4200,
      platformCents: 2100,
    },
    prepaidOrders: 6,
    confirmedOrders: 11,
    availablePerHandoverCents: 4200,
    cargoKg: 96,
    capacityKg: 400,
    windowConfirmed: true,
    fallbackAvailable: true,
    runnerId: 'run_lungile',
    incrementalKm: 9.1,
    stops: 6,
  },
  {
    id: 'route_orlando_gated',
    label: 'Orlando East → gated precinct doorstep loop',
    zoneId: 'zone_orlando',
    tier: 'doorstep',
    hubId: 'hub_ilitha',
    departsAt: 'Fri 16:30',
    ledger: {
      labourCents: 34_000,
      fuelVehicleCents: 18_600,
      hubCents: 5200,
      riskCents: 14_500,
      platformCents: 2600,
    },
    prepaidOrders: 4,
    confirmedOrders: 5,
    availablePerHandoverCents: 5000,
    cargoKg: 41,
    capacityKg: 65,
    windowConfirmed: false,
    fallbackAvailable: false,
    runnerId: 'run_nomsa',
    incrementalKm: 21.7,
    stops: 5,
  },
]

export function findZone(zoneId: string): Zone | undefined {
  return zones.find((zone) => zone.id === zoneId)
}

export function findHub(hubId: string): Hub | undefined {
  return hubs.find((hub) => hub.id === hubId)
}

export function findRunner(runnerId: string): RunnerProfile | undefined {
  return runners.find((runner) => runner.id === runnerId)
}

/** Service tier labels used across every surface so wording never diverges. */
export const serviceTierLabels: Record<ServiceTier, string> = {
  hub_collection: 'Hub collection',
  cluster_drop: 'Clustered drop',
  doorstep: 'Doorstep delivery',
  existing_trip: 'Existing-trip runner',
  cold_chain: 'Cold-chain route',
}
