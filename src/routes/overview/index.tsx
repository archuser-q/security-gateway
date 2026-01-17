import BarChart from '@/components/chart/BarChart'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <BarChart/>
  )
}
