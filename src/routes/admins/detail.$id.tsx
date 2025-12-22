import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admins/detail/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admins/detail/$id"!</div>
}
