import OverViewColumnChart from '@/components/chart/OverviewColumnChart'
import SystemMindMap from '@/components/chart/MindMap'
import { createFileRoute } from '@tanstack/react-router'
import { LoginCountColumnChart } from '@/components/chart/LoginCountColumnChart'

export const Route = createFileRoute('/_authenticated/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <SystemMindMap />
      <OverViewColumnChart />
      <LoginCountColumnChart />
    </div>
  )
}
