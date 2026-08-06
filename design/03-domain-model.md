# 03 — Domain Model

## 1. Identity: People, Organisations, Roles

A person is one record with many roles (Principle: buyer today, runner tomorrow, hub operator next year). Roles carry their own verification tier, milestones, and permissions. Organisations (spaza shops, churches, schools, buying groups, suppliers) are separate entities linked to people through role grants.

```mermaid
erDiagram
  PERSON ||--o{ ROLE_GRANT : holds
  ORGANISATION ||--o{ ROLE_GRANT : hosts
  PERSON ||--o{ CONSENT : gives
  PERSON ||--o{ DEVICE : binds
  ROLE_GRANT ||--o{ MILESTONE_EVENT : accrues
  ORGANISATION ||--o{ ENDORSEMENT : receives
  PERSON ||--o{ ENDORSEMENT : receives

  PERSON {
    uuid id PK
    string display_name
    string phone_e164 UK
    string language_pref
    string kyc_tier
    timestamptz created_at
  }
  ORGANISATION {
    uuid id PK
    string kind "spaza|church|school|community_hall|buying_group|supplier|ngo"
    string name
    uuid zone_id FK
    geometry location
    string verification_status
  }
  ROLE_GRANT {
    uuid id PK
    uuid person_id FK
    uuid organisation_id FK "nullable"
    string role "member|spaza_owner|coordinator|runner|hub_operator|field_agent|ops_admin"
    string status "pending|active|suspended|revoked"
    jsonb capabilities "cold_chain, doorstep, stockshare flags"
  }
```

- `kyc_tier` steps: `t0_phone` (phone-verified) → `t1_identity` (ID document) → `t2_enhanced` (runners, hub operators: ID + institutional endorsement + address). Capabilities like cold-chain routes require the tier named in their entry criteria.
- `ENDORSEMENT` records institution-backed vouching (church, stokvel, NASASA affiliate, established spaza), feeding the trust graph.

## 2. Catalogue and Pricing

```mermaid
erDiagram
  SKU ||--o{ SUPPLIER_OFFER : priced_by
  SUPPLIER ||--o{ SUPPLIER_OFFER : publishes
  SUPPLIER_OFFER ||--o{ PRICE_TIER : has
  SKU ||--o{ SUBSTITUTION_RULE : allows

  SKU {
    uuid id PK
    string name
    string category
    string pack_size
    string barcode
    boolean ambient
    boolean cold_chain_required
  }
  SUPPLIER_OFFER {
    uuid id PK
    uuid sku_id FK
    uuid supplier_id FK
    uuid zone_id FK
    int unit_price_cents
    int moq_units
    date valid_until
  }
  PRICE_TIER {
    uuid id PK
    uuid offer_id FK
    int min_units
    int unit_price_cents
  }
```

- **Landed cost** per SKU per zone = tier unit price + allocated logistics + hub handling + platform fee. Computed by `packages/economics`; shown pre-confirmation (Principle 4).
- `SUBSTITUTION_RULE` encodes approved swaps (brand/pack) with a policy: `auto_allowed | ask_first | never`. Substitutions outside rules require explicit buyer approval via the channel.

## 3. Ordering and Pooling

The **canonical order** is the contract with a household member or spaza. The **group cycle** pools orders; the **consolidated PO** is the contract with a supplier. Allocation lines keep the decomposition lossless in both directions.

```mermaid
erDiagram
  ORDER ||--|{ ORDER_LINE : contains
  GROUP_CYCLE ||--o{ ORDER : pools
  BUYING_GROUP ||--o{ GROUP_CYCLE : runs
  GROUP_CYCLE ||--o{ CONSOLIDATED_PO : produces
  CONSOLIDATED_PO ||--|{ PO_LINE : contains
  PO_LINE ||--|{ ALLOCATION : splits_into
  ORDER_LINE ||--o{ ALLOCATION : fulfilled_by
  CONSOLIDATED_PO ||--o{ SUPPLIER_INVOICE : billed_by
  ORDER ||--o{ HANDOVER : completed_by

  ORDER {
    uuid id PK
    string order_ref UK "human-readable, shared across channels"
    uuid buyer_person_id FK
    uuid buyer_org_id FK "nullable: spaza orders"
    string kind "household|spaza_procurement"
    string channel_origin "whatsapp|app|pwa|ops_desk"
    string status
    int comparator_total_cents "retail comparator shown at confirmation"
    int quoted_total_cents
    int final_total_cents "post-reconciliation"
  }
  GROUP_CYCLE {
    uuid id PK
    uuid group_id FK
    uuid zone_id FK
    timestamptz opens_at
    timestamptz locks_at
    string status
  }
  CONSOLIDATED_PO {
    uuid id PK
    uuid supplier_id FK
    uuid cycle_id FK
    string status
    int total_cents
  }
```

### Order lifecycle

```mermaid
stateDiagram-v2
  [*] --> draft: lines parsed or basket built
  draft --> quoted: landed comparison shown
  quoted --> confirmed: explicit buyer confirmation
  quoted --> abandoned: expiry / buyer declines
  confirmed --> pooled: joined group cycle
  pooled --> locked: cycle locks, payment verified
  locked --> procured: consolidated PO placed
  procured --> at_hub: stock received and allocated
  at_hub --> fulfilled: handover verified (PIN/QR)
  at_hub --> exception: uncollected / damaged / short
  exception --> fulfilled: resolution (redeliver, credit)
  exception --> refunded
  fulfilled --> reconciled: invoice final, saving computed
  reconciled --> [*]
```

Invariants:

- `draft → confirmed` never happens automatically from free text (channel rule).
- `pooled → locked` requires verified payment state (prepaid or approved settlement workflow) — routes and POs are never placed against unverified money.
- `reconciled` is the only state that triggers savings allocation and referral-reward eligibility.

### Group cycle lifecycle

```mermaid
stateDiagram-v2
  [*] --> open: cycle scheduled per zone
  open --> locking: locks_at reached
  locking --> locked: payments verified, tier computed
  locking --> extended: below tier threshold, one bounded extension
  extended --> locked
  extended --> cancelled: still below threshold
  locked --> po_placed
  po_placed --> receiving
  receiving --> reconciling: all allocations at hubs
  reconciling --> closed: invoices final, statements issued
  cancelled --> [*]
  closed --> [*]
```

## 4. Fulfilment: Hubs, Routes, Handovers

```mermaid
erDiagram
  HUB ||--o{ STOCK_MOVEMENT : records
  HUB ||--o{ HANDOVER : hosts
  ROUTE ||--o{ ROUTE_STOP : visits
  ROUTE_STOP ||--o{ HANDOVER : produces
  TRIP_DECLARATION ||--o| ROUTE : matched_to
  ROUTE ||--o{ ROUTE_COST_LEDGER : accrues

  HUB {
    uuid id PK
    uuid organisation_id FK
    jsonb operating_hours
    int max_stock_value_cents "insured cap"
    boolean cold_capable
    string status
  }
  ROUTE {
    uuid id PK
    uuid zone_id FK
    string tier "hub_collection|cluster_drop|doorstep|existing_trip|cold_chain"
    uuid runner_grant_id FK
    string status
    int floor_cents_per_handover "computed at gating"
    int expected_handovers
    int completed_handovers
  }
  TRIP_DECLARATION {
    uuid id PK
    uuid runner_grant_id FK
    timestamptz departs_at
    geometry origin
    geometry destination
    int capacity_kg
    string vehicle "walk|taxi|bakkie|car"
  }
  HANDOVER {
    uuid id PK
    uuid order_id FK
    uuid hub_id FK "nullable for doorstep"
    string proof_kind "pin|qr|signature"
    string status "pending|verified|failed|disputed"
    timestamptz verified_at
  }
  STOCK_MOVEMENT {
    uuid id PK
    uuid hub_id FK
    uuid allocation_id FK
    string kind "scan_in|scan_out|shrinkage|return|stockshare_out|stockshare_in"
    uuid actor_grant_id FK
  }
```

### Route lifecycle (density-gated)

```mermaid
stateDiagram-v2
  [*] --> proposed: tasks bundled along a trip or schedule
  proposed --> gated: economics evaluated
  gated --> released: prepaid orders >= N_min and floor cleared
  gated --> held: below gate - wait, re-bundle, or fall back to hub tier
  held --> gated: re-evaluation
  held --> cancelled: window expired, fallback executed
  released --> in_progress: runner accepts and starts
  in_progress --> completed: all stops resolved
  in_progress --> aborted: safety escalation / failure
  completed --> reconciled: costs, rewards, claims posted
  aborted --> reconciled
  reconciled --> [*]
```

The gate itself (thresholds, floor computation, fallbacks) is specified in `05-logistics-route-economics.md`. The state machine guarantees that `released` is unreachable without a passing gate evaluation recorded on the route row.

## 5. Ledger: Non-Custodial Double-Entry

The ledger records **allocations and obligations**, not custody. Funds live with licensed partners; each ledger account carries a `custodian` reference so statements can always say where real money sits (Principle 6).

```mermaid
erDiagram
  LEDGER_ACCOUNT ||--o{ POSTING : credited_or_debited
  JOURNAL_ENTRY ||--|{ POSTING : balances
  JOURNAL_ENTRY }o--|| SOURCE_EVENT : justified_by

  LEDGER_ACCOUNT {
    uuid id PK
    string owner_kind "person|organisation|group|platform|partner"
    uuid owner_id
    string bucket "personal_savings|emergency_buffer|community_investment|distribution_pool|payable|receivable|fees|risk_reserve"
    string custodian "finance partner reference"
    string currency "ZAR"
  }
  JOURNAL_ENTRY {
    uuid id PK
    string kind "saving_allocation|runner_reward|hub_fee|platform_fee|referral_reward|refund|claim_adjustment"
    uuid source_event_id FK
    timestamptz posted_at
  }
  POSTING {
    uuid id PK
    uuid entry_id FK
    uuid account_id FK
    bigint amount_cents "signed; entry sums to zero"
  }
```

Posting rules (implemented once in `packages/ledger`):

- Every `JOURNAL_ENTRY` must reference a verified `SOURCE_EVENT` (e.g. `order.reconciled`, `handover.verified`, `route.reconciled`). No manual free-form postings; ops adjustments are their own typed entry kind with mandatory reason and approver.
- Savings allocation on `order.reconciled` splits the verified saving across buckets **per the member's own allocation choice** (immediate discount / personal savings / voluntary stokvel allocation / split) captured at confirmation.
- The four community buckets (personal savings, emergency buffer, community investment, distribution pool) are governed by documented group rules; emergency/investment contributions must be voluntary flags on the member's split.
- Referral rewards post only on the referred participant's `order.reconciled`, are capped, and have exactly one beneficiary level — the schema has no parent-referrer chain to traverse.

## 6. Trust Graph

```mermaid
erDiagram
  ROLE_GRANT ||--o{ RELIABILITY_EVENT : accrues
  ROLE_GRANT ||--|| RELIABILITY_SCORE : summarised_by
  DISPUTE ||--o{ DISPUTE_STEP : progresses
  ORDER ||--o{ DISPUTE : may_raise
  HANDOVER ||--o{ DISPUTE : may_raise

  RELIABILITY_EVENT {
    uuid id PK
    uuid grant_id FK
    string kind "on_time|late|failed|substitution_ok|substitution_bad|dispute_upheld|dispute_dismissed|claim"
    int weight
    timestamptz occurred_at
  }
  DISPUTE {
    uuid id PK
    string raised_by_kind
    string status "open|community_mediation|platform_review|resolved|escalated"
    string outcome
  }
```

- `RELIABILITY_SCORE` is a decayed weighted sum recomputed from events — never manually edited. It feeds route eligibility, hub stock-value caps, app-milestone unlocks, and partner scorecards.
- Dispute flow honours community-led resolution: `open → community_mediation` (coordinator/institution mediates) before `platform_review`. Every step is recorded for pattern detection.

## 7. Consent and Data Governance Entities

```mermaid
erDiagram
  CONSENT ||--o{ CONSENT_PURPOSE : scopes
  CONSENT {
    uuid id PK
    uuid person_id FK
    string channel "whatsapp|sms|app"
    string status "granted|withdrawn"
    timestamptz captured_at
    string evidence_ref "message id / form ref"
  }
  CONSENT_PURPOSE {
    uuid id PK
    uuid consent_id FK
    string purpose "ordering|marketing|finance_referral|analytics"
  }
```

- Outbound marketing and finance-referral data flows check `CONSENT_PURPOSE` at the API layer (Principle 8). Ordering-transactional messages ride on the ordering purpose.
- CPPI aggregation reads only zone/category/cycle rollups produced by a pipeline that enforces the k-anonymity threshold (see `07-security-privacy-compliance.md`).

## 8. Identifier and Reference Conventions

- All primary keys are UUIDv7 (time-ordered, index-friendly).
- `order_ref` is a short human-readable code (e.g. `NK-7F3K2`) safe to read over a phone call or WhatsApp voice note; it is the number printed on invoices and quoted in disputes.
- Handover PINs are single-use, scoped to one handover, delivered over the buyer's channel with SMS fallback, and never logged in plaintext.
