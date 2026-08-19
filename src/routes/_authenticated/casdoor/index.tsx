import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/casdoor/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/casdoor/"!</div>
}
