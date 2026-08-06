# 08 — APIs, Events and Integration

## 1. API Surfaces

| Surface | Consumers | Style | Auth |
|---|---|---|---|
| First-party API | StoreOnline PWA, Android app, Ops Console, Partner Portal front end | tRPC over HTTPS (typed contracts from `packages/domain`) | Session (OTP/passkey) + role-grant RBAC |
| Partner REST API | Supplier systems, finance partners | Versioned REST + JSON, OpenAPI-documented | OAuth2 client credentials, scoped tokens |
| Webhooks (inbound) | WhatsApp BSP, SMS gateway, payment providers, supplier systems | Signed webhooks | Signature verification + replay protection |
| Webhooks (outbound) | Suppliers (PO events), finance partners (referral status) | Signed, retried with backoff, idempotency keys | HMAC signatures |

Conventions for all surfaces:

- Money in integer cents (ZAR); explicit `currency` field.
- All mutations accept an `Idempotency-Key`; retries are safe.
- Errors follow a problem-details shape with stable machine-readable codes.
- Every request resolves to a role grant; permissions are evaluated server-side per resource.
- Cursor pagination; UTC timestamps; zone-scoped list endpoints.

## 2. Core First-Party Resources

Representative operations (not exhaustive), grouped by module:

| Module | Operations |
|---|---|
| identity | `registerContact`, `verifyOtp`, `submitKyc`, `grantRole`, `getMilestones` |
| catalogue | `searchSkus`, `getLandedQuote(zone, lines)`, `getSubstitutionPolicy` |
| ordering | `createDraftOrder`, `updateLines`, `confirmOrder`, `getOrder(orderRef)`, `cancelBeforeLock` |
| pooling | `getOpenCycle(zone)`, `getCycleStatus`, ops: `lockCycle`, `extendCycle` |
| hub-ops | `scanIn(allocation)`, `verifyHandover(pin)`, `reportException`, `getExpectedDeliveries` |
| logistics | `declareTrip`, `listRouteOffers`, `acceptRoute`, `completeStop`, `raiseSafetyEscalation` |
| stockshare | `postNeed`, `postSurplus`, `confirmTransfer`, `scanTransfer` |
| ledger | `getStatements`, `getBucketBalances`, `requestCashOut`, `requestApplyToBasket` |
| consent | `captureConsent`, `withdrawConsent`, `getConsentState` |
| disputes | `openDispute`, `addEvidence`, `recordMediationOutcome` |

## 3. Domain Event Catalogue

Events are the platform's spine: written to the outbox in the same transaction as the state change, relayed to Redis streams, consumed by ledger, compensation, notifications, CPPI, and partner webhooks. Names are versioned (`.v1`).

| Event | Emitted when | Key consumers |
|---|---|---|
| `order.confirmed.v1` | Buyer explicitly confirms a draft | pooling, notifications, milestones |
| `order.locked.v1` | Payment verified at cycle lock | pooling, notifications |
| `order.reconciled.v1` | Final invoice applied; saving computed | **ledger** (savings allocation, referral eligibility), notifications, CPPI |
| `cycle.locked.v1` / `cycle.closed.v1` | Cycle transitions | pooling, ops dashboards, CPPI |
| `po.placed.v1` / `po.receipted.v1` | Consolidated PO lifecycle | partner webhooks, hub-ops |
| `allocation.at_hub.v1` | Scan-in matches allocation | notifications (collection PIN), hub-ops |
| `handover.verified.v1` | PIN/QR verified | **ledger** (hub fee), trust, notifications |
| `handover.failed.v1` | Window expired / failure | logistics (fallback), trust |
| `route.released.v1` | Gate passed and runner accepted | notifications, ops route control |
| `route.reconciled.v1` | Costs and outcomes final | **compensation → ledger**, trust, zone economics |
| `stockshare.completed.v1` | Transfer scanned both sides | ledger, trust |
| `dispute.resolved.v1` | Outcome recorded | trust, compensation (claims adjustments) |
| `consent.withdrawn.v1` | Any purpose withdrawn | notifications, cppi, partner-sync |
| `milestone.reached.v1` | e.g. 3 cycles / 60 days + 30 SKUs | channels (app invitation), ops |
| `payment.settled.v1` / `payment.failed.v1` | Provider webhook processed | ordering, notifications, reconciliation |

Consumer rules: idempotent handlers keyed on event ID; dead-letter queue with ops visibility; replay tooling for rebuilding projections (CPPI, scorecards) from the event log.

## 4. WhatsApp BSP Integration

- **Inbound**: BSP webhook → channels worker → conversation state machine. Media fetched, stored, queued for parsing. Delivery receipts update message state.
- **Outbound**: notification orchestrator renders localised templates → BSP send API. Template categories managed for Meta approval (transactional vs marketing); marketing sends check `marketing` consent.
- **Session vs template messages**: within the 24-hour customer-service window, free-form; outside it, approved templates only — the orchestrator picks automatically.
- **Interactive messages**: buttons and list messages for confirmation, substitution approval, collection scheduling; numbered-reply fallback always works.
- **Agent handoff**: conversation flagged `agent_handoff` routes to the console; agent replies go out through the same BSP thread; the bot resumes on explicit release.
- **Parsing service contract**: `parse(media|text, context) → { lines: [{skuCandidates, qty, confidence}], language }`. Lines under the confidence threshold go to the human review queue; corrections feed the matcher's training set.

## 5. Supplier Integration

Maturity ladder mirroring commercial reality (most wholesalers start manual):

| Level | Catalogue/pricing | Orders | Status |
|---|---|---|---|
| L0 manual | Ops enters offers from price lists | PO emailed as PDF from the platform | Ops updates manually |
| L1 structured | Scheduled CSV/XLSX price-feed ingestion with diff review | PO as structured document + portal confirmation | Portal updates |
| L2 API | Price feed API pull | PO push via partner REST + webhook confirmations | Webhook status events |

All levels produce identical internal records (`SUPPLIER_OFFER`, `CONSOLIDATED_PO`) so upgrading a supplier's level changes no downstream behaviour. Partner Portal gives every supplier: open POs, confirmations, lead times, fulfilment scorecards, campaign management.

## 6. Payment Provider Integration

Adapter interface per provider (see `06-payments-wallet-finance.md` §2):

- `createPaymentRequest(orderRef, amount, rail)` → link/QR/reference
- `verifyWebhook(payload, signature)` → `payment.settled.v1` / `payment.failed.v1`
- `queryStatus(paymentRef)` for reconciliation sweeps
- `initiateRefund(paymentRef, amount)` for cycle cancellations and failed routes

Reconciliation sweeps run daily against provider settlement reports; mismatches open exception cases rather than silently adjusting.

## 7. Finance Partner Integration

- **Referral packet push**: consent-checked, versioned JSON schema (shop profile, procurement history aggregates, invoice/settlement performance, fulfilment scores). No conversation data, no household data.
- **Status webhook**: partner returns `received | in_review | approved | declined | more_info` — displayed neutrally.
- **Data agreements**: packet schema and purposes are contract exhibits; the export log records every packet.

## 8. Internal Analytics Flow

Event stream → warehouse projections (per-zone route economics, cycle savings, partner scorecards, pilot KPIs). Dashboards read projections, never OLTP. CPPI exports are produced from warehouse cells passing the k-anonymity gate, with the release checklist from `07-security-privacy-compliance.md`.
