import OverViewColumnChart from '@/components/chart/OverviewColumnChart'
import SystemMindMap from '@/components/chart/MindMap'
import { createFileRoute } from '@tanstack/react-router'
import { LoginCountColumnChart } from '@/components/chart/LoginCountColumnChart'

export const Route = createFileRoute('/_authenticated/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-4 space-y-6">
      <SystemMindMap />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <LoginCountColumnChart />
        </div>
        <div className="flex-1">
          <OverViewColumnChart />
        </div>
      </div>
    </div>
  )
}
