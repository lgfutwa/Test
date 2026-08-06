# 09 — Delivery Roadmap

The build is sequenced so the platform earns each layer of complexity (Principle 10). Phases are defined by **entry and exit criteria**, not calendar dates: a phase ends when its commercial proof point is measured true by the platform's own instrumentation. Each phase maps to a stage of the commercial rollout.

## Phase 0 — Foundation (pre-commercial)

**Build scope.**

- Monorepo scaffold (`apps/core`, `apps/ops`, `apps/channels`, `packages/db|domain|ledger|economics|config`).
- Identity + role grants + consent registry; catalogue + supplier offers (L0 manual); canonical ordering with `order_ref`; outbox + event relay; audit trail.
- Ops Console order desk capable of running everything manually (degraded-mode guarantee).
- WhatsApp BSP integration: inbound webhook, conversation state machine for stock-list capture, template sends, agent handoff console.
- Payments stage 1: EFT/proof-of-payment workflow with ops verification.
- `packages/economics` v1: landed-cost quote, savings computation, route floor and `N_min` functions — fully unit-tested before any commercial use.

**Exit criteria.** An end-to-end dry run: WhatsApp stock list → draft → confirmation → manual PO → simulated receipt → reconciliation statement, with every step producing correct ledger entries and audit records.

## Phase 1 — Community Orders (Rollout stage 1)

**Commercial proof point:** members achieve verified saving after all fees.

**Build scope.**

- StoreOnline PWA: group join, basket against cycle, expected savings, prepayment links (payments stage 2), allocation choice.
- Pooling: zone cycle calendar, lock/extend/cancel flows, tier evaluation, consolidated PO (L0/L1 suppliers).
- Reconciliation desk: invoice ingestion, credit notes, verified-saving statements to WhatsApp + PDF.
- Ledger live: savings allocation postings, member statements.

**Instrumentation added.** Confirmed orders and group purchase value; verified saving per household after all fees; repeat order rate at 30/60/90 days.

**Exit criteria.** Two consecutive cycles where median member saving is positive after all fees and statements reconcile to the cent.

## Phase 2 — Hub Pilots (Rollout stage 2)

**Commercial proof point:** high successful collection rate, low shrinkage.

**Build scope.**

- Hub-ops module: scan-in against allocations, storage windows, PIN/QR handover, exception flows, stock movement ledger, hub fee accrual.
- Notification orchestration with SMS fallback (collection PINs).
- Trust module v1: reliability events from handovers, dispute ladder with community mediation.
- One verified hub + one fallback hub onboarded with agreements, caps, and trial cycle.

**Instrumentation added.** Successful handover rate; hub shrinkage/loss/damage/claims; hub sort time and pickup duration.

**Exit criteria.** Collection completion above target (e.g. ≥ 95%) across two cycles; shrinkage within the insured cap model; every exception resolved through the recorded flows.

## Phase 3 — Spaza Procurement (Rollout stage 3)

**Commercial proof point:** lower landed costs, fewer stock-outs, repeat orders for 10–20 shops.

**Build scope.**

- Procurement flows hardened for shops: multi-supplier landed comparison, reorder templates, per-shop milestone tracker.
- Parsing service v1 (voice notes, invoice photos) with human review queue.
- Supplier L1 integrations (price-feed ingestion) for the anchor wholesaler + comparison supplier.
- Partner Portal v1: PO confirmation, fulfilment scorecards.

**Instrumentation added.** Verified landed-cost saving per shop; stock-out rate on core SKUs; time from stock-list to confirmed order; active repeat shops.

**Exit criteria.** ≥ 10 shops with ≥ 3 reconciled cycles each; median landed saving positive; WhatsApp-to-confirmation time within operational target.

## Phase 4 — Aggregated Buying and Routes (Rollout stage 4)

**Commercial proof point:** supplier volume tiers reached and profitable route density.

**Build scope.**

- Logistics engine: trip declarations, bundler, eligibility filters, economic gate (`N_min`, `P_floor`), route lifecycle, runner offers with full payout stack, fallback automation.
- Compensation engine: runner/distributor/hub payout stacks posting to ledger on `route.reconciled`.
- Zone playbook configuration (service windows, no-go geofences, risk classes, comparator sets).
- Regional group POs across zones; scheduled route templates (town-to-hub runs).

**Instrumentation added.** Successful handovers per paid route; route cost per successful handover; runner/distributor earnings per route and per hour; share of routes profitable without subsidy; failed-delivery rate; incremental km per route.

**Exit criteria.** A sustained share of routes clearing their floor without subsidy (target set from pilot, trending up across cycles); zero released routes below gate (structural check); runner earnings credible per route/hour.

## Phase 5 — StockShare and Demand Intelligence (Rollout stage 5)

**Commercial proof point:** faster replenishment and better inventory turns.

**Build scope.**

- StockShare: need/surplus posting, trust-bounded matching, transfer scans, settlement links.
- CPPI pipeline: warehouse projections, k-anonymity gate, release checklist tooling, partner exports.
- Demand forecasting v1: reorder recommendations and stock-out warnings from cycle history.

**Instrumentation added.** StockShare fulfilment time vs stock-out duration; forecast accuracy; inventory-turn proxies per shop.

**Exit criteria.** StockShare resolves urgent stock-outs measurably faster than the next procurement cycle; first CPPI export passes the full release checklist.

## Phase 6 — App-Led Operations and Partners (Rollout stage 6)

**Commercial proof point:** compliance-ready records and sustainable unit economics.

**Build scope.**

- Android procurement app (Expo): offline-first drafting, catalogue, invoices, stock alerts, shop roles, hub scans, StockShare — invitations driven by `milestone.reached` events; WhatsApp remains permanent fallback.
- Supplier L2 (API) integrations; manufacturer-direct tiers for proven categories.
- Finance-readiness pathway: referral packets, partner webhooks, consent flows (payments stages 3–4).
- Cold-chain tier where zone criteria are met (equipment, certification, SOPs, spoilage reserve).

**Instrumentation added.** WhatsApp-to-app migration after milestone; finance referrals vs approvals (kept separate); cold-chain temperature compliance; supplier share concentration.

**Exit criteria.** App-active shops operate faster than WhatsApp-only baseline without support-load increase; first finance referrals processed end-to-end under consent; unit economics positive at cluster level.

## Cross-Phase Engineering Practices

- **Testing.** `packages/economics` and `packages/ledger` at ~100% branch coverage (they move money); state machines property-tested against invariants (no `released` below gate, entries balance to zero, no order confirmed without explicit confirmation event); integration tests per module flow; a synthetic "pilot simulation" seed that replays a full cycle end-to-end in CI.
- **Migrations.** Forward-only Drizzle migrations; ledger and audit tables append-only by grant.
- **Feature flags.** Every unlockable capability (doorstep tier, cold chain, StockShare, finance referral, app invitations) is a flag bound to its entry criteria, evaluated per zone.
- **Observability.** Route-economics traces and reconciliation traces are first-class OpenTelemetry spans; weekly zone health reports generated from projections, not spreadsheets.
- **Ops readiness per phase.** Each phase ships with runbooks: cycle-lock failure, BSP outage, payment-webhook gaps, hub incident, safety escalation.

## KPI Wiring Summary

Every pilot metric from the business documents has a named owner metric in the platform:

| Business KPI | Platform source |
|---|---|
| Confirmed orders and group purchase value | `order.confirmed` / `cycle.closed` projections |
| Verified landed-cost saving per shop/household | Reconciliation statements (ledger) |
| Successful handovers per paid route | `handover.verified` per `route.reconciled` |
| Route cost per successful handover | Route cost ledger ÷ verified handovers |
| Stock-out rate for core SKUs | Procurement + StockShare projections |
| Runner/distributor earnings per route/hour | Compensation entries + route durations |
| Hub shrinkage and claims rate | Stock movements + claims cases |
| Repeat order rate 30/60/90 days | Order projections per buyer |
| WhatsApp-to-app migration after milestone | Milestone tracker + app activation events |
| Share of routes profitable without subsidy | Gate evaluations vs reconciled outcomes |
