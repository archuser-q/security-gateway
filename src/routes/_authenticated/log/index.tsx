import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea, Paper } from "@mantine/core"
import { GlobalRequestList } from '@/components/log_list/GlobalRequestList'

function RouteComponent() {
  return (
    <Paper shadow="sm" p="md" className="h-[600px]">
      <ScrollArea h="100%">
        <GlobalRequestList />
      </ScrollArea>
    </Paper>
  )
}

export const Route = createFileRoute('/_authenticated/log/')({
  component: RouteComponent,
})