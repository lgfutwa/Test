# 06 — Payments, Wallet and Embedded Finance

Nikela-OS separates **ordering and coordination** (Nikela's domain) from **regulated financial services** (licensed partners' domain). This document specifies the payments ladder, the non-custodial ledger, savings allocation, and the finance-readiness pathway.

## 1. The Boundary

| Nikela-OS does | Nikela-OS never does |
|---|---|
| Record orders, invoices, settlement state, allocations, rewards | Hold deposits or client funds |
| Issue payment links / references via licensed providers | Process card payments on its own licence |
| Compute and display verified savings and allocations | Lend, or present credit eligibility as guaranteed |
| Provide consent-scoped transaction evidence to finance partners | Make credit decisions |
| Maintain group-rule workflows for stokvel buckets | Receive, administer, direct, or condition social grants |

Every wallet screen names the custodian. If a licensed partner relationship ends, balances remain claims against that partner, visible with settlement status — the architecture makes "Nikela as bank" impossible rather than merely prohibited.

## 2. Payments Ladder

Payment capability grows with relationship maturity; the ordering flow never assumes more capability than the user has.

| Stage | Capability | Platform behaviour |
|---|---|---|
| First order | EFT / bank transfer, proof-of-payment upload, approved cash-and-carry settlement workflow | Manual-assisted reconciliation by ops; order `pooled → locked` only when ops verifies payment evidence |
| Repeat procurement | Payment links, QR, bank-transfer references | Provider webhooks drive settlement state automatically; invoice and payment state visible in-channel |
| Wallet/savings | Pre-funding or scheduled products **held at the licensed partner** | Ledger mirrors partner balance and allocation; cash-out and apply-to-basket route through partner rails |
| Finance-ready | Supplier credit / inventory finance via regulated partner | Consent-scoped referral packet; partner decides independently |

Implementation notes:

- **Payment provider adapter interface** (`packages/domain`): `createPaymentRequest`, `getSettlementState`, webhook verification — implemented per provider (EFT/link/QR providers, merchant acquiring partner). No provider specifics leak into ordering.
- **Settlement state machine** per payment: `requested → pending → settled | failed | expired | refunded`. Cycle lock reads this state; partial payments hold the order out of the cycle with a clear user message.
- **Refund paths** are first-class: cancelled cycles and failed routes release prepayments automatically through the original rail, with ledger entries reflecting the reversal.

## 3. Ledger Design (Double-Entry, Non-Custodial)

Schema in `03-domain-model.md` §5; rules here.

### Account taxonomy

| Account bucket | Owner | Meaning |
|---|---|---|
| `personal_savings` | Person | Verified savings retained for future purchasing power |
| `emergency_buffer` | Group | Voluntary shared emergency fund per group rules |
| `community_investment` | Group | Voluntary community project fund per group rules |
| `distribution_pool` | Zone/group | Funds runner and coordinator rewards |
| `receivable` / `payable` | Platform/partner | Obligations awaiting settlement on partner rails |
| `fees` | Platform | Earned coordination, hub, platform fees |
| `risk_reserve` | Platform/zone | Priced risk pool per route tier |

### Posting rules

1. Every journal entry balances to zero and references a verified source event. The allowed (event → entry kind) pairs are a closed, code-reviewed list.
2. **Savings allocation** on `order.reconciled`:
   - `verified_saving = comparator_total − (supplier_cost + logistics_fee + hub_fee + platform_fee)` for the member's allocation.
   - Split across immediate discount / `personal_savings` / voluntary group buckets exactly per the member's recorded choice at confirmation. Defaults favour immediate affordability; group-bucket contributions require explicit opt-in under documented group rules.
3. **Rewards** (`route.reconciled`, `handover.verified` accruals) post from `distribution_pool` / `fees` into the earner's account with the full payout-stack breakdown as entry metadata.
4. **Referral rewards**: one beneficiary, capped total per referred participant, source event is the referred participant's `order.reconciled`. There is no structure to express a second tier.
5. **Adjustments** (claims, corrections) are typed entries requiring reason code + approver identity; they never rewrite history — corrections are new entries.
6. Rounding: splits computed in cents with largest-remainder distribution so the sum always equals the source amount exactly.

### Statements

- Per order: comparator basis, supplier price, each fee, verified saving, allocation split — the same statement in WhatsApp (text), PDF invoice, and app.
- Per period: bucket balances with custodian, movements, and drill-down to source events.
- Per route/cycle for earners: payout stack per route, reliability trend, claims status.

## 4. Group (Stokvel) Governance Layer

Digital stokvel buckets follow documented group rules to preserve the cultural trust and the NCA stokvel exemption posture:

- **Group constitution record**: contribution rules, bucket split policy, withdrawal rules (e.g. emergency-fund quorum), office bearers, NASASA affiliation reference where applicable. Versioned; members see the version they agreed to.
- **Rule-enforced workflows**: bucket withdrawals and split changes execute through workflows that enforce the constitution (approvals, notice periods). Ops cannot bypass them without a compliance-desk override that is itself logged.
- **Transparency**: any member can view group bucket balances, movements, and pending approvals at any time.
- Thresholds that would trigger registration or regulatory requirements (aggregate contribution levels) are monitored by the compliance desk with automated alerts.

## 5. Finance-Readiness Pathway

The platform's role is evidence, not credit:

1. **Record**: procurement history, invoice reconciliation, payment consistency, fulfilment performance, dispute/claims rates accumulate as a natural by-product of operations.
2. **Qualify**: a shop meeting a partner's published criteria (e.g. trading history, monthly volume) is flagged as referral-eligible — visibility only, no promise.
3. **Consent**: the owner explicitly consents to sharing a defined referral packet with a named partner for a named purpose (`finance_referral` consent purpose).
4. **Refer**: the packet (orders, invoices, settlement history, fulfilment scores — no raw conversation data) goes to the partner over the partner API.
5. **Decide**: the partner assesses independently and returns a status. Nikela displays status neutrally and never frames outcomes as guaranteed or influenced by platform standing.

Referral revenue (technology/referral fee from the partner) is recorded against the platform `fees` account and disclosed in partner terms.

## 6. Fraud and Financial Controls

- One verified account per person (phone + KYC dedup); device binding and PIN for financially sensitive actions.
- Velocity and anomaly rules on referral rewards, StockShare transfers, and cash-out requests; flags route to the compliance desk.
- Segregation of duties in ops: reconciliation, adjustments, and payout approval are distinct permissions.
- Immutable audit: ledger tables are append-only at the database level (no UPDATE/DELETE grants to the application role beyond status columns on operational tables).
- Monthly three-way reconciliation: platform ledger vs partner settlement reports vs supplier invoices, with exception queues.
