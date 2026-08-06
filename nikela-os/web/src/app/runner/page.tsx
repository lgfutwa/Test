import { PageHeader } from '@/components/page-header'
import { RunnerConsole } from '@/components/runner/runner-console'

export const metadata = {
  title: 'Nikela Runners — gated community routes',
}

export default function RunnerPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Nikela Runners · community couriers"
        title="Earn from a trip you were already making."
        description="Routes are only offered once prepaid orders clear the route's cost floor per successful handover. You see the whole payout stack before you accept, and declining never affects your score."
        meta={[
          { label: 'Daylight-first scheduling', tone: 'brand' },
          { label: 'Prepaid orders only' },
          { label: 'Incremental detour and load are paid' },
          { label: 'Cold chain requires certification' },
        ]}
      />
      <RunnerConsole />
    </div>
  )
}
