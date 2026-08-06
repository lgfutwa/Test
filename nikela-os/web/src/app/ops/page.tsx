import { OpsConsole } from '@/components/ops/ops-console'
import { PageHeader } from '@/components/page-header'

export const metadata = {
  title: 'Ops console — Nikela-OS control room',
}

export default function OpsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Ops console · Nikela staff"
        title="Run the pilot by hand if you have to."
        description="Order desk, cycle lock, route gate evaluation and reconciliation in one place. Every override is reason-coded and recorded, so the degraded-mode path is auditable rather than improvised."
        meta={[
          { label: 'Order desk acts on behalf of users', tone: 'brand' },
          { label: 'Gate blocks release, not permission' },
          { label: 'Append-only corrections' },
        ]}
      />
      <OpsConsole />
    </div>
  )
}
