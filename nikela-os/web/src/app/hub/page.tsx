import { HubConsole } from '@/components/hub/hub-console'
import { PageHeader } from '@/components/page-header'
import { findHub } from '@/lib/data/network'

export const metadata = {
  title: 'Nikela Hubs — receiving and verified handover',
}

export default function HubPage() {
  const hub = findHub('hub_sibongile')

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Nikela Hubs · hub operators"
        title={hub?.name ?? 'Hub console'}
        description="A hub is an operating role, not just a pickup point. Stock is scanned in against expected allocations, every handover is PIN-verified, and the handling fee is earned per successful handover — never hidden in the product price."
        meta={[
          { label: hub?.operatingHours ?? 'Operating hours', tone: 'brand' },
          { label: 'Ambient goods only' },
          { label: 'Insured stock-value cap enforced' },
          { label: 'Camera scanning on the operator’s own phone' },
        ]}
      />
      <HubConsole />
    </div>
  )
}
