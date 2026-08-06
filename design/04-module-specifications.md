# 04 — Module Specifications

Each module below is specified as: purpose, users, key flows, functional requirements (FR), and unlock criteria where Principle 10 (earn complexity) applies. Cross-references: domain objects in `03-domain-model.md`, formulas in `05-logistics-route-economics.md`, ledger rules in `06-payments-wallet-finance.md`.

---

## 4.1 Channels (WhatsApp Conversation Engine)

**Purpose.** The conversion and support layer: turn familiar WhatsApp behaviour (text, voice notes, photos) into structured, confirmed orders, and keep WhatsApp permanently available as fallback for every other module.

**Users.** Spaza owners, household members, runners, hub operators; Nikela agents on the human side.

**Key flows.**

1. **Stock-list capture**: free text ("20 maize meal 10kg…"), voice note, invoice photo, or shelf photo → parsing service produces draft lines with per-line confidence → low-confidence lines route to an agent queue → draft order quoted back with landed comparison → numbered-reply confirmation.
2. **Order lifecycle notifications**: confirmation, payment instructions, cycle lock, dispatch, hub-arrival, collection PIN, statement.
3. **Support and disputes**: reach-a-human always one reply away; agent console shows full conversation + order context.
4. **Reorder nudges**: template-based reminders from reorder engine, consent-gated.

**Functional requirements.**

- FR-CH1: A free-text message never creates a confirmed order; drafts require explicit confirmation (reply `1`, button tap). Confirmation records message ID as evidence.
- FR-CH2: Conversation state machine per contact; any state can branch to `agent_handoff`; agents act through the same core APIs (one order identity, Principle 1).
- FR-CH3: All templates localised (isiZulu, isiXhosa, Sesotho, Afrikaans, English at minimum), short, button/numbered-reply first, low-res images only.
- FR-CH4: Quoted drafts always show: current landed estimate vs Nikela estimate, delivery/collection window, substitution policy, fees breakdown (Principle 4).
- FR-CH5: Outbound non-transactional messages require `marketing` consent purpose; opt-out honoured within one message.
- FR-CH6: Media (voice notes, photos) stored in object storage with retention policy; parsing outputs retain provenance to source media.

---

## 4.2 Nikela Procurement (Spaza Ordering)

**Purpose.** Consolidated procurement for spazas: supplier comparison, group price tiers, reorder templates, invoices, and delivery tracking — the platform's commercial wedge.

**Users.** Spaza owners, coordinators, ops order desk.

**Key flows.**

1. First quote: stock list → SKU matching → per-supplier landed comparison → draft.
2. Confirmed order joins the zone's procurement cycle; pooling computes achieved price tier at lock.
3. Receiving: goods to shop or hub; short/damaged lines create exceptions and credit notes.
4. Reconciliation statement: prior price vs Nikela landed price per line, fees, verified saving, next cycle date.
5. Reorder templates from recurring lines; stock-out alerts once inventory signals exist (app phase).

**Functional requirements.**

- FR-PR1: Landed price shown pre-confirmation includes supplier price, logistics allocation, hub fee, platform fee — separately visible.
- FR-PR2: Every line traces to `ALLOCATION` rows against a consolidated PO; partial fulfilment and credit notes reconcile to the cent.
- FR-PR3: Multi-supplier by construction: each cycle keeps at least one comparison supplier's quote on record (partnership principle: multi-supplier resilience).
- FR-PR4: Milestone tracking per shop (cycles completed, recurring SKUs, volume) drives the app invitation (see 4.10 unlock table).
- FR-PR5: No exclusivity: a shop can decline any cycle without penalty; templates and history remain theirs.

---

## 4.3 StoreOnline (Households and Buying Groups)

**Purpose.** Consumer-facing module: join buying groups, build baskets against group cycles, see expected and verified savings, choose savings allocation, track collection/delivery.

**Users.** Household members, coordinators.

**Key flows.**

1. Join a group (invite by coordinator, hub QR, or WhatsApp link) with consent capture.
2. Basket building against the open cycle; expected saving shown per line and total.
3. Prepayment via payment link/EFT reference before cycle lock.
4. Savings allocation choice at confirmation: immediate discount / personal savings credit / voluntary stokvel allocation / split.
5. Collection: hub-arrival notification → PIN/QR handover → statement with verified saving.

**Functional requirements.**

- FR-SO1: PWA, installable, offline-tolerant basket drafting; low-data assets.
- FR-SO2: The retail comparator basis (which retailer, when priced) is disclosed on every expected-saving figure.
- FR-SO3: Group membership is voluntary and exit is one tap; group rules (bucket splits, emergency fund policy) are readable in-app and versioned.
- FR-SO4: No feature may condition participation on grant status; the platform stores no grant data.
- FR-SO5: Members without smartphones are first-class: coordinators/agents can operate the full flow on their behalf via the ops desk, with SMS confirmations to the member's phone.

---

## 4.4 Demand Pooling and Consolidated Purchasing

**Purpose.** Turn confirmed orders into supplier-ready consolidated POs at the best achievable tier, per zone and cycle.

**Users.** Internal (automated) + ops order desk oversight; supplier portal on the receiving end.

**Key flows.**

1. Cycle scheduling per zone (weekly/fortnightly), lock time published in advance.
2. At lock: verify payment states, aggregate lines by SKU, evaluate `PRICE_TIER` thresholds, select supplier(s) per category, emit consolidated PO(s).
3. Below-threshold handling: one bounded extension, then either place at the lower tier with member re-confirmation of the new price, or cancel lines with automatic release of prepayments.
4. PO decomposition: allocation lines per shop/member per hub, packed-by-allocation instructions to the supplier or breaking-bulk instructions to the hub.

**Functional requirements.**

- FR-PL1: A price shown at confirmation is a ceiling: reconciliation may improve it (higher tier reached) but a worse price always requires re-confirmation.
- FR-PL2: Tier evaluation and supplier selection are deterministic and logged (auditable supplier choice, competition-law hygiene).
- FR-PL3: Cycle calendar respects supplier lead times and route schedules; a locked cycle always has a fulfilment plan (hub set + route tiers) before the PO is placed.

---

## 4.5 Nikela Hubs (Receiving, Storage, Handover)

**Purpose.** Controlled local distribution endpoints with unbroken chain of custody: receive consolidated stock, separate allocations, verify handovers, reconcile exceptions.

**Users.** Hub operators; ops for oversight and claims.

**Key flows.**

1. Receiving: scan-in against expected allocations; discrepancies logged at the door (short, damaged, substituted).
2. Storage: within `max_stock_value_cents` cap and storage window; cold items only if `cold_capable`.
3. Handover: collector presents PIN/QR → verify → scan-out → `handover.verified` event (triggers hub fee accrual and buyer statement).
4. Exceptions: uncollected after window → fallback flow (reschedule, neighbour proxy with pre-authorisation, return-to-cycle, refund); damage/shrinkage → claims workflow with photo evidence.
5. Reconciliation: periodic stock counts vs movement ledger; shrinkage rate feeds trust score and insurability data.

**Functional requirements.**

- FR-HB1: Every unit entering or leaving a hub is a `STOCK_MOVEMENT` with actor identity; no untracked stock.
- FR-HB2: Hub fees accrue only on `handover.verified` — per successful handover, never hidden in product price.
- FR-HB3: Hub agreements (hours, capacity, liability, insurance boundaries, escalation) are stored, versioned, and surfaced in the operator UI.
- FR-HB4: Handover UI works on the operator's own Android phone (app or WhatsApp-guided flow) — no dedicated hardware requirement at pilot; barcode scanning via camera.
- FR-HB5: Storage-window and stock-cap breaches alert ops automatically.

**Unlock criteria.** An organisation becomes a hub only with: verified identity (t2), signed agreement, physical check by field agent, endorsement record, and a trial cycle at reduced stock cap.

---

## 4.6 Nikela Runners and Logistics (Client-Facing Side)

**Purpose.** Let verified community members monetise trips they already make, through gated, scheduled, transparent tasks. (The matching/gating engine itself is specified in `05-logistics-route-economics.md`.)

**Users.** Runners; ops route control.

**Key flows.**

1. Trip declaration: departure time, origin/destination, capacity, vehicle kind — via app or WhatsApp guided flow.
2. Route offer: bundled tasks with expected reward breakdown, stops, weights, and windows; accept/decline without penalty for decline.
3. Execution: pick-up scans, per-stop navigation, handover verification, exception reporting (recipient absent → hub fallback), safety escalation button.
4. Earnings: per-route statement showing the payout stack (base, weight/distance, cluster, quality, risk) and running reliability score.

**Functional requirements.**

- FR-RN1: A runner sees the full reward before accepting; no post-hoc reward reductions except substantiated claims (never punitive debt).
- FR-RN2: Cash handling minimised: prepaid orders by default; where cash settlement is unavoidable it follows the documented cash-light protocol with reconciliation.
- FR-RN3: Route eligibility filters: KYC tier, reliability score, capacity, cold-chain certification flag, no-go zones/times.
- FR-RN4: Location tracking only while a route is `in_progress`, disclosed to the runner, and retained per data policy.

**Unlock criteria.** Runner activation requires t2 KYC + endorsement; cold-chain tasks require certified equipment and training flags; doorstep-tier tasks require reliability score above threshold.

---

## 4.7 Nikela StockShare

**Purpose.** Short-radius inventory balancing between participating spazas: urgent stock-outs matched to nearby surplus, with verified transfer.

**Users.** App-active spazas (this is an app-led feature by design).

**Key flows.**

1. Requesting shop posts a need (SKU, quantity, needed-by).
2. Matching against nearby shops' declared surplus (radius- and trust-bounded).
3. Priced offer (transfer price + runner fee if not self-collected) → both parties confirm → transfer movements scanned out/in → settlement via payment link between shops, platform records state.

**Functional requirements.**

- FR-SS1: Only verified, app-active shops within the same zone participate; per-transfer value caps by trust tier.
- FR-SS2: Transfers create `stockshare_out`/`stockshare_in` movements on both sides; disputes use the standard dispute flow.
- FR-SS3: Nikela does not set resale prices; it displays the requesting shop's landed alternatives for transparency.

**Unlock criteria.** Feature flag per zone; enabled after procurement cycles in that zone are stable (Phase 5 of the roadmap).

---

## 4.8 Wallet and Savings Ledger (Member-Facing Side)

**Purpose.** Give every member, group, and runner a transparent, real-time view of allocations: personal savings, voluntary stokvel buckets, rewards — with custody always at a licensed partner. (Ledger mechanics: `06-payments-wallet-finance.md`.)

**Key flows.**

1. Statement per reconciled order: comparator, supplier price, fees, verified saving, allocation split.
2. Bucket views: personal savings, emergency buffer, community investment, distribution pool — each with group-rule context and custodian disclosure.
3. Cash-out / apply-to-basket requests routed to the finance partner's rails; ledger reflects settlement state.
4. Runner/hub earnings statements per route/cycle.

**Functional requirements.**

- FR-WL1: Every balance line links to its journal entries and their source events — full drill-down.
- FR-WL2: The UI always names the custodian ("held at [partner]") and never presents Nikela as a deposit-taker.
- FR-WL3: Group-bucket withdrawals follow the group's documented rules (e.g. quorum approval for emergency fund) enforced in-workflow.

---

## 4.9 CPPI (Community Purchasing Power Index)

**Purpose.** Privacy-preserving aggregated demand intelligence for suppliers and partners: confirmed demand by category and hub, savings potential at tiers, seasonality, stock-out risk.

**Users.** Suppliers/partners via the Partner Portal; internal forecasting.

**Functional requirements.**

- FR-CP1: Aggregation pipeline outputs only rows meeting the k-anonymity threshold (k ≥ 20 distinct buyers per zone/category/period cell; cells below threshold are suppressed or merged upward).
- FR-CP2: No individual identity, grant status, household history, or vulnerability signal is derivable from any export; re-identification review is part of the release checklist.
- FR-CP3: Partner access is contract- and consent-scoped; every export is logged with recipient and purpose.
- FR-CP4: Internal forecasting may use finer-grained data internally under the `analytics` purpose but never exports it.

---

## 4.10 Android Procurement App (Progressive Unlock)

**Purpose.** The structured operations layer for shops that have proven repeat behaviour: catalogue ordering, invoices, inventory, roles, hub operations, StockShare, finance-readiness records.

**Unlock table** (evaluated continuously by the milestone tracker; invitation is optional, assisted, reversible):

| Trigger | Condition |
|---|---|
| Repeat behaviour | ≥ 3 completed procurement cycles within 60 days AND ≥ 30 recurring SKUs |
| Volume | Monthly procurement volume above the zone threshold (set from pilot data) |
| Role need | Shop becomes a hub, StockShare partner, or needs multi-user roles |
| Shop request | Inventory visibility, invoice history, finance-readiness records requested |

**Functional requirements.**

- FR-AP1: Android-first, small base install, modular optional features, offline-first drafting with queued sync (Principle 7).
- FR-AP2: Role-based access within a shop: owner, buyer, cashier, hub operator, accountant.
- FR-AP3: PIN + device binding; no mandatory bank account for basic procurement.
- FR-AP4: WhatsApp remains fully functional for every app user (fallback and preference are permanent).

---

## 4.11 Ops Console

**Purpose.** The internal control room: it must be capable of running the entire pilot manually (Principle: degraded-mode ops).

**Capabilities.**

- **Order desk**: create/edit/confirm orders on behalf of users; parsing-review queue for low-confidence lines; live cycle dashboard.
- **Catalogue and pricing desk**: SKU matching, supplier offers, tier maintenance, comparator price capture.
- **Route control**: gate evaluations, manual holds/releases with reason codes, live route tracking, safety escalation handling.
- **Reconciliation desk**: invoice ingestion, credit notes, savings computation review, statement issuance.
- **Disputes and claims**: full-context case views, community-mediation tracking, claims evidence, insurance reporting.
- **Compliance desk**: consent registry queries, data-subject requests (POPIA), export logs, referral-reward audits.
- **Partner scorecards**: pilot KPI dashboards per supplier/partner (order accuracy, fulfilment, GMV, savings).

---

## 4.12 Partner Portal

**Purpose.** Supplier and finance-partner workspace.

**Capabilities.**

- Suppliers: receive consolidated POs, confirm availability and lead times, publish price feeds/tiers, view fulfilment scorecards, manage approved campaign placements (clearly labelled, no dark patterns, member choice preserved).
- Finance partners: receive consent-scoped referral packets (procurement history, fulfilment performance) for independent assessment; return decision status only. No credit decisioning inside Nikela-OS.
