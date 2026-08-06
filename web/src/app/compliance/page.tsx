import { EyeOff, FileCheck2, ScaleIcon, UserCheck } from 'lucide-react'
import { ReferralAudit } from '@/components/compliance/referral-audit'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { StatTile } from '@/components/ui/stat-tile'
import { formatRand } from '@/lib/money'

export const metadata = {
  title: 'Compliance desk — Nikela-OS controls',
}

const consentRegistry = [
  {
    purpose: 'Ordering (transactional)',
    granted: 312,
    withdrawn: 4,
    channel: 'WhatsApp, SMS, app',
  },
  { purpose: 'Marketing', granted: 188, withdrawn: 27, channel: 'WhatsApp' },
  { purpose: 'Finance referral', granted: 11, withdrawn: 1, channel: 'App, signed form' },
  { purpose: 'Analytics', granted: 296, withdrawn: 9, channel: 'All' },
]

const cppiCells = [
  { cell: 'Khayelitsha · Maize meal · Week 31', buyers: 41, released: true },
  { cell: 'Khayelitsha · Cooking oil · Week 31', buyers: 33, released: true },
  { cell: 'Umlazi · Long-life milk · Week 31', buyers: 22, released: true },
  { cell: 'Orlando East · Cake flour · Week 31', buyers: 7, released: false },
  { cell: 'Umlazi · Washing powder · Week 31', buyers: 14, released: false },
]

const K_THRESHOLD = 20

export default function CompliancePage() {
  const suppressed = cppiCells.filter((cell) => !cell.released)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Compliance desk · internal"
        title="The guardrails are structure, not policy documents."
        description="Consent is bound to purpose at the API layer, referral rewards are single-tier and capped by schema, and no aggregated cell is exported below the k-anonymity threshold."
        meta={[
          { label: 'POPIA purpose binding', tone: 'brand' },
          { label: 'CPA s43(4) evidence pack' },
          { label: `k ≥ ${K_THRESHOLD} for every export` },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active consents"
          value={`${consentRegistry.reduce((sum, row) => sum + row.granted, 0)}`}
          hint="Purpose-bound, evidence referenced"
        />
        <StatTile
          label="Withdrawals honoured"
          value={`${consentRegistry.reduce((sum, row) => sum + row.withdrawn, 0)}`}
          hint="Effective within one message"
        />
        <StatTile
          label="CPPI cells suppressed"
          value={`${suppressed.length}`}
          hint={`Below k = ${K_THRESHOLD} distinct buyers`}
          tone="negative"
        />
        <StatTile
          label="Stokvel threshold headroom"
          value={formatRand(4_120_000)}
          hint="Monitored against registration triggers"
          tone="positive"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            eyebrow="POPIA"
            title="Consent registry"
            description="Processing without a matching purpose is rejected before it reaches a module."
            action={
              <Badge tone="muted">
                <UserCheck aria-hidden className="size-3" />
                Purpose-bound
              </Badge>
            }
          />
          <CardBody className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-300">
                  <th className="px-4 py-2.5 font-semibold">Purpose</th>
                  <th className="px-4 py-2.5 font-semibold">Channels</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Granted</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Withdrawn</th>
                </tr>
              </thead>
              <tbody>
                {consentRegistry.map((row) => (
                  <tr
                    key={row.purpose}
                    className="border-b border-ink-100 text-[13px] last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-ink-900">{row.purpose}</td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-500">{row.channel}</td>
                    <td className="tabular px-4 py-2.5 text-right text-ink-900">{row.granted}</td>
                    <td className="tabular px-4 py-2.5 text-right text-ink-500">{row.withdrawn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            eyebrow="CPPI release gate"
            title="Aggregated demand, substantively de-identified"
            description="Cells below the threshold are suppressed or merged upward, never rounded and released."
            action={
              <Badge tone="muted">
                <EyeOff aria-hidden className="size-3" />k ≥ {K_THRESHOLD}
              </Badge>
            }
          />
          <CardBody className="space-y-2">
            {cppiCells.map((cell) => (
              <div
                key={cell.cell}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-ink-900">{cell.cell}</p>
                  <p className="text-[11.5px] text-ink-300">{cell.buyers} distinct buyers</p>
                </div>
                {cell.released ? (
                  <Badge tone="brand">
                    <FileCheck2 aria-hidden className="size-3" />
                    Released
                  </Badge>
                ) : (
                  <Badge tone="danger">Suppressed</Badge>
                )}
              </div>
            ))}
            <p className="text-[11.5px] leading-relaxed text-ink-300">
              No export contains identifiers, exact locations, basket-level records, grant status or
              any vulnerability signal. Each release is logged with recipient, purpose and checksum.
            </p>
          </CardBody>
        </Card>
      </div>

      <ReferralAudit />

      <Card>
        <CardHeader
          eyebrow="Boundaries"
          title="What the platform structurally cannot do"
          description="These are schema and code-path constraints, not promises in a policy."
          action={
            <Badge tone="muted">
              <ScaleIcon aria-hidden className="size-3" />
              By construction
            </Badge>
          }
        />
        <CardBody>
          <ul className="grid gap-2.5 text-[12.5px] leading-relaxed text-ink-500 sm:grid-cols-2">
            <li>
              <span className="font-medium text-ink-900">No second referral tier</span> — the reward
              function takes one beneficiary and a cap; there is no downline to traverse.
            </li>
            <li>
              <span className="font-medium text-ink-900">No custody of funds</span> — every ledger
              account carries a custodian reference to a licensed partner.
            </li>
            <li>
              <span className="font-medium text-ink-900">No joining fees or stock loading</span> —
              there is no product in the catalogue a participant must buy to hold a role.
            </li>
            <li>
              <span className="font-medium text-ink-900">No grant data</span> — grant status is
              never collected, derived, stored or exported.
            </li>
            <li>
              <span className="font-medium text-ink-900">No credit decisions</span> — referral
              packets go to licensed partners, who decide independently and return status only.
            </li>
            <li>
              <span className="font-medium text-ink-900">No silent overrides</span> — reason codes
              and approver identity are mandatory, and corrections are new append-only entries.
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
