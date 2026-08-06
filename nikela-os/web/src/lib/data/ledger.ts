import type { Cents } from '../money'

export type LedgerBucket =
  | 'personal_savings'
  | 'emergency_buffer'
  | 'community_investment'
  | 'distribution_pool'

export interface BucketBalance {
  bucket: LedgerBucket
  label: string
  description: string
  /** Funds are held by a licensed partner; Nikela records the allocation only. */
  custodian: string
  balanceCents: Cents
  ownerKind: 'person' | 'group' | 'zone'
  /** Group buckets follow documented rules, e.g. quorum before withdrawal. */
  withdrawalRule: string
}

export interface JournalEntry {
  id: string
  kind:
    | 'saving_allocation'
    | 'runner_reward'
    | 'hub_fee'
    | 'platform_fee'
    | 'referral_reward'
    | 'refund'
    | 'claim_adjustment'
  postedAt: string
  sourceEvent: string
  orderRef?: string
  routeId?: string
  narrative: string
  postings: Array<{ account: string; amountCents: Cents }>
}

export const memberBuckets: BucketBalance[] = [
  {
    bucket: 'personal_savings',
    label: 'Personal savings credit',
    description: 'Verified savings kept for future baskets or cash-out',
    custodian: 'Licensed payments partner (ring-fenced client account)',
    balanceCents: 84_150,
    ownerKind: 'person',
    withdrawalRule: 'Available on request; settles on partner rails within 2 business days',
  },
  {
    bucket: 'emergency_buffer',
    label: 'Group emergency buffer',
    description: 'Voluntary shared fund for members facing shocks',
    custodian: 'Licensed savings partner (group account)',
    balanceCents: 312_400,
    ownerKind: 'group',
    withdrawalRule: 'Requires group quorum approval per the constitution (v3, adopted 12 Jun 2026)',
  },
  {
    bucket: 'community_investment',
    label: 'Community investment fund',
    description: 'Voluntary contributions earmarked for local projects',
    custodian: 'Licensed savings partner (group account)',
    balanceCents: 147_900,
    ownerKind: 'group',
    withdrawalRule: 'Requires project mandate plus two office-bearer approvals',
  },
  {
    bucket: 'distribution_pool',
    label: 'Distribution reward pool',
    description: 'Funds runner and coordinator rewards for the zone',
    custodian: 'Licensed payments partner (operating account)',
    balanceCents: 268_700,
    ownerKind: 'zone',
    withdrawalRule: 'Disbursed automatically on verified route reconciliation',
  },
]

export const journal: JournalEntry[] = [
  {
    id: 'je_1',
    kind: 'saving_allocation',
    postedAt: '2026-08-01 18:42',
    sourceEvent: 'order.reconciled.v1',
    orderRef: 'NK-8HD73',
    narrative: 'Verified saving allocated per member split (60/25/10/5)',
    postings: [
      { account: 'Platform clearing', amountCents: -24_150 },
      { account: 'Immediate basket discount', amountCents: 14_490 },
      { account: 'Personal savings credit', amountCents: 6038 },
      { account: 'Group emergency buffer', amountCents: 2415 },
      { account: 'Community investment fund', amountCents: 1207 },
    ],
  },
  {
    id: 'je_2',
    kind: 'runner_reward',
    postedAt: '2026-07-30 15:10',
    sourceEvent: 'route.reconciled.v1',
    routeId: 'route_khay_thu',
    narrative: 'Runner payout stack for 14 verified handovers',
    postings: [
      { account: 'Distribution reward pool', amountCents: -15_780 },
      { account: 'Runner earnings — Nomsa Dlamini', amountCents: 15_780 },
    ],
  },
  {
    id: 'je_3',
    kind: 'hub_fee',
    postedAt: '2026-07-30 15:12',
    sourceEvent: 'handover.verified.v1',
    orderRef: 'NK-9QM41',
    narrative: 'Hub handling fee — paid per successful handover only',
    postings: [
      { account: 'Platform fees', amountCents: -600 },
      { account: 'Hub earnings — Sibongile Spaza', amountCents: 600 },
    ],
  },
  {
    id: 'je_4',
    kind: 'referral_reward',
    postedAt: '2026-07-28 11:05',
    sourceEvent: 'order.reconciled.v1',
    orderRef: 'NK-2LX88',
    narrative: 'Single-tier referral reward, capped, paid after referred order reconciled',
    postings: [
      { account: 'Platform fees', amountCents: -1200 },
      { account: 'Personal savings credit', amountCents: 1200 },
    ],
  },
  {
    id: 'je_5',
    kind: 'claim_adjustment',
    postedAt: '2026-07-26 09:48',
    sourceEvent: 'dispute.resolved.v1',
    orderRef: 'NK-3VC26',
    narrative: 'Substantiated short-delivery claim credited to member',
    postings: [
      { account: 'Risk reserve — Khayelitsha', amountCents: -4380 },
      { account: 'Personal savings credit', amountCents: 4380 },
    ],
  },
]

export interface StatementLine {
  label: string
  amountCents: Cents
  emphasis?: 'positive' | 'negative' | 'total'
  note?: string
}

/** Reconciled statement for the member surface: the transparency contract. */
export const reconciledStatement = {
  orderRef: 'NK-8HD73',
  cycle: 'Week 31 — Site C Household Buying Group',
  comparatorBasis: 'Local wholesaler walk-in price captured 27 Jul 2026',
  lines: [
    { label: 'Retail comparator basket', amountCents: 238_840 },
    {
      label: 'Supplier price (tier reached: 60+ units)',
      amountCents: -196_400,
      note: 'Boxer Bulk Online',
    },
    {
      label: 'Logistics fee',
      amountCents: -8160,
      note: 'Existing-trip runner, 5.4 km incremental',
    },
    { label: 'Hub handling fee', amountCents: -3600, note: 'Paid on verified handover only' },
    { label: 'Platform coordination fee', amountCents: -4910, note: '2.5% of supplier price' },
    { label: 'Verified saving', amountCents: 25_770, emphasis: 'total' as const },
  ] satisfies StatementLine[],
}
