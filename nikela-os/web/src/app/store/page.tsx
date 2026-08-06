import { PageHeader } from '@/components/page-header'
import { StoreOnline } from '@/components/store/store-online'
import { currentCycle } from '@/lib/data/cycles'
import { findZone } from '@/lib/data/network'

export const metadata = {
  title: 'StoreOnline by Nikela — household buying groups',
}

export default function StorePage() {
  const zone = findZone(currentCycle.zoneId)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="StoreOnline · households and buying groups"
        title="Buy with your neighbours. Choose what happens to the saving."
        description="Your basket stays yours; only the volume is shared. After the final invoice you decide whether the verified saving lowers today's price, builds personal savings, or goes into voluntary group funds."
        meta={[
          { label: zone ? `${zone.name}, ${zone.region}` : 'Zone', tone: 'brand' },
          { label: `Cycle locks ${currentCycle.locksAt}` },
          { label: 'Hub collection default' },
          { label: 'Participation is voluntary' },
        ]}
      />
      <StoreOnline />
    </div>
  )
}
