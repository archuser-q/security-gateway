import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admins/add')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admins/add"!</div>
}
