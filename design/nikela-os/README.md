# Nikela-OS Platform Design

Nikela-OS is the **community commerce operating system** for South Africa: a B2B2C platform that aggregates household and spaza-shop demand into consolidated procurement, coordinates trusted local fulfilment through hubs and runners, and converts verified savings into transparent personal and stokvel value.

This package is the end-to-end platform design. It translates the Nikela / Ukunikela business concept, partnership strategy, channel strategy (WhatsApp-first, app-progressive), and last-mile profitability benchmarks into a buildable system: architecture, domain model, module specifications, logistics economics, payments and ledger design, compliance controls, APIs, and a phased delivery roadmap.

## Document Map

| # | Document | What it covers |
|---|---|---|
| 01 | [Vision, Scope and Design Principles](./01-vision-scope-principles.md) | What Nikela-OS is and is not, actors and roles, the ten design principles that constrain every other document |
| 02 | [System Architecture](./02-system-architecture.md) | Context diagram, service decomposition, technology stack, monorepo layout, deployment topology, offline and low-data strategy |
| 03 | [Domain Model](./03-domain-model.md) | Core entities and relationships (ERD), canonical order identity, lifecycle state machines, double-entry ledger model |
| 04 | [Module Specifications](./04-module-specifications.md) | Functional specs per module: StoreOnline, Procurement, Hubs, Runners, StockShare, Wallet/Savings Ledger, CPPI, Channels, Ops Console, Partner Portal |
| 05 | [Logistics and Route Economics](./05-logistics-route-economics.md) | Assignment engine, route release gates, price-floor and reward formulas, service tiers, cold-chain path, risk layer |
| 06 | [Payments, Wallet and Embedded Finance](./06-payments-wallet-finance.md) | Payments ladder, non-custodial ledger design, savings allocation flows, finance-readiness records, partner boundaries |
| 07 | [Security, Privacy and Compliance](./07-security-privacy-compliance.md) | POPIA consent registry, CPA s43(4) guardrails, trust graph, KYC tiers, RBAC, audit and data governance |
| 08 | [APIs, Events and Integration](./08-apis-events-integration.md) | API conventions, core resources, domain event catalogue, WhatsApp BSP, supplier catalogue, payment-provider integration |
| 09 | [Delivery Roadmap](./09-delivery-roadmap.md) | Six build phases mapped to the commercial rollout stages, pilot instrumentation, KPI wiring |

## How to Read This Package

- Read `01` first; every later decision traces back to its design principles.
- `02` and `03` define the technical skeleton. `04`–`08` are the flesh: each module or cross-cutting concern is specified against the skeleton.
- `09` sequences the build so that the platform earns each layer of complexity (WhatsApp before app, hub collection before doorstep delivery, operational value before finance).

## Glossary of Roles

| Role | Description |
|---|---|
| **Member (household buyer)** | A StoreOnline user who joins a buying group, builds baskets, and collects from a hub or receives delivery |
| **Spaza owner** | An independent retailer using Nikela Procurement for consolidated stock ordering |
| **Coordinator** | Organiser of a local buying group: gathers orders, manages the group cycle, liaises with hubs and runners |
| **Runner** | A verified community courier who fulfils scheduled routes, often using trips already taking place |
| **Hub operator** | A verified spaza, church, school, or community site that receives, stores, and hands over consolidated stock |
| **Supplier** | Wholesaler, cash-and-carry, distributor, or FMCG manufacturer fulfilling consolidated purchase orders |
| **Field agent** | Nikela staff/contractor who onboards shops and members, and handles assisted WhatsApp workflows |
| **Ops admin** | Internal Nikela operator managing catalogue, pricing, routes, disputes, reconciliation, and compliance |
| **Finance partner** | A licensed bank, payment provider, or lender that owns all regulated financial products |

## Source Inputs

This design synthesises the following business documents (kept outside the repo):

- Nikela / Ukunikela Business Concept Reports (v1 and v2)
- Nikela Commercial Partnerships Strategy 2026–2028
- Nikela WhatsApp vs Mobile App Spaza Procurement Strategy
- Ukunikela South Africa Last-Mile Profitability Benchmarks
- Distributed stokvel grocery e-commerce deep-research reports
