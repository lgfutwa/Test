# Nikela-OS Web

Front end for the Nikela-OS community commerce operating system, implementing the surfaces specified in [`design/nikela-os`](../../design/nikela-os/README.md).

The platform's commercial formulas are implemented once, in `src/lib/economics.ts`, and every surface renders their output rather than recomputing prices locally. A member, a shop owner and an ops operator therefore always see the same number for the same order.

## Surfaces

| Route | Audience | What it does |
|---|---|---|
| `/` | Everyone | Surface switcher and platform overview |
| `/procure` | Spaza owners | WhatsApp stock-list capture, parsing with confidence scores, landed-cost comparison per line, explicit confirmation, app-invitation milestones |
| `/store` | Households and buying groups | Basket against the open group cycle, pooled tier progress, savings allocation chooser, PIN collection |
| `/runner` | Community couriers | Trip declaration, gated route offers, full payout stack before acceptance |
| `/hub` | Hub operators | Receiving scan-in with exception logging, single-use PIN handover verification |
| `/wallet` | Members, groups, earners | Non-custodial bucket balances with custodian disclosure, journal drill-down to source events |
| `/ops` | Nikela staff | Order desk, cycle lock, route gate evaluation with cost ledger, reconciliation statement |
| `/compliance` | Compliance function | Consent registry, CPPI k-anonymity release gate, CPA s43(4) referral audit |

## Running

```bash
bun install
bun run dev      # http://localhost:3200
```

```bash
bun test         # economics and quote engine unit tests
bun run type-check
bun run lint
bun run build
```

## Architecture Notes

- **`src/lib/economics.ts`** — landed cost and price tiers, verified saving, savings allocation (largest-remainder split), route cost ledger, price floor per successful handover, minimum-handover release gate, floor positioning against the R37–R50 comparator band, runner and distributor payout stacks, single-tier capped referral reward.
- **`src/lib/money.ts`** — all amounts are integer cents in ZAR. `splitByWeights` uses the largest-remainder method so a savings split always reconciles to the cent.
- **`src/lib/quote.ts`** — stock-list parsing (free text and transcribed voice notes) and quote building. The price tier is selected on **pooled** cycle volume while the buyer pays only for their own units, which is the mechanism the platform exists to provide.
- **`src/lib/data/`** — representative pilot data for Khayelitsha, Umlazi and Orlando East: ambient staple catalogue with supplier tiers and disclosed retail comparators, hubs, runners, shops, route candidates with cost ledgers, and ledger journal entries.
- **`src/components/ui/`** — local component kit. `MoneyLine` renders every fee, so no surface can fold a fee into a product price; `GateChecklist` always shows why a route is held.

## Design Constraints Honoured in Code

- A parsed stock list never becomes an order: confirmation is a separate, explicit action.
- Low-confidence parse lines are flagged for agent review and excluded from the quote instead of being guessed.
- Route release is blocked by the gate, not by permission — the release control is disabled while any of the five checks fails.
- Group savings buckets are only funded from a split the member chooses.
- Every wallet balance names its custodian; the surface never presents Nikela as a deposit-taker.
- The referral reward function accepts one beneficiary and a cap, so a second tier cannot be expressed.

## Scope

Representative pilot data only. No live supplier feeds, payment rails, WhatsApp Business connection or personal information are wired up; those integrations are specified in [`08-apis-events-integration.md`](../../design/nikela-os/08-apis-events-integration.md).
