import BarChart from '@/components/chart/BarChart'
import SystemMindMap from '@/components/chart/MindMap'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <SystemMindMap />
      <BarChart />
    </div>
  )
}
