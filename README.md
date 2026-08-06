# Nikela-OS

Community commerce operating system for South Africa: consolidated spaza and household procurement, trusted local hubs, density-gated community delivery, and transparent savings ledgers.

## Contents

| Path | Description |
|---|---|
| [`design/`](./design/README.md) | Platform design package — vision, architecture, domain model, module specs, logistics economics, payments, compliance, APIs, roadmap |
| [`web/`](./web/README.md) | Working Next.js front end implementing the design surfaces over a shared economics engine |

## Quick start (front end)

```bash
cd web
bun install
bun run dev      # http://localhost:3200
```

```bash
bun test
bun run type-check
bun run lint
bun run build
```

## Surfaces

| Route | Audience |
|---|---|
| `/procure` | Spaza owners — WhatsApp stock-list capture, landed-cost comparison, confirmation |
| `/store` | Households — group cycle basket, savings allocation, PIN collection |
| `/runner` | Couriers — trip declaration, gated route offers, payout stack |
| `/hub` | Hub operators — scan-in, PIN handover verification |
| `/wallet` | Members — non-custodial buckets, journal drill-down |
| `/ops` | Staff — order desk, cycle lock, route gate, reconciliation |
| `/compliance` | Compliance — consent registry, CPPI k-gate, CPA referral audit |

## Design principles (summary)

1. One backend, one order identity across WhatsApp, app, invoices and partners.
2. WhatsApp earns the first order; the app earns the operating system.
3. Density before delivery — routes release only when prepaid orders clear the cost floor.
4. Transparent economics — every fee is disclosed separately before confirmation.
5. Rewards follow verified operations; referrals are capped at one tier.
6. Non-custodial by construction — licensed partners hold funds; Nikela records allocations.
7. Offline-tolerant, low-data, Android-first.
8. Consent-based, minimal data (POPIA).
9. Trust is layered (community + KYC + chain of custody).
10. Earn complexity — ambient before cold chain, wholesalers before manufacturer-direct, ops before finance.
