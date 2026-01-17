import BarChart from '@/components/chart/BarChart'
import MindMap from '@/components/chart/MindMap'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="relative w-full h-[600px]">
      <div className="absolute inset-0">
        <MindMap />
      </div>
      <div className="absolute inset-0">
        <BarChart />
      </div>
    </div>
  )
}
