import { PageHeader } from '@/components/page-header'
import { MilestoneTracker } from '@/components/procure/milestone-tracker'
import { ProcurementWorkbench } from '@/components/procure/procurement-workbench'
import { currentCycle } from '@/lib/data/cycles'
import { findZone } from '@/lib/data/network'

export const metadata = {
  title: 'Nikela Procurement — spaza consolidated ordering',
}

export default function ProcurePage() {
  const zone = findZone(currentCycle.zoneId)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Nikela Procurement · spaza owners"
        title="Send your stock list. See the landed price before you confirm."
        description="Orders from nearby shops and households are pooled to reach supplier price tiers. Every fee is disclosed separately, and the quoted price is a ceiling — reconciliation can only improve it."
        meta={[
          { label: zone ? `${zone.name}, ${zone.region}` : 'Zone', tone: 'brand' },
          { label: `${zone?.cycleCadence ?? 'Weekly'} cycle · locks ${currentCycle.locksAt}` },
          { label: 'Ambient staples only' },
          { label: 'WhatsApp-first' },
        ]}
      />
      <ProcurementWorkbench />
      <MilestoneTracker />
    </div>
  )
}
