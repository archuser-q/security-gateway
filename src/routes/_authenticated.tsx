// src/routes/authenticated.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { Header } from '@/components/Header'
import { Navbar } from '@/components/Navbar'
import {
  APPSHELL_HEADER_HEIGHT,
  APPSHELL_NAVBAR_WIDTH,
} from '@/config/constant'

const AuthenticatedLayout = () => {
  const [opened, { toggle }] = useDisclosure(false)

  return (
    <AppShell
      header={{ height: APPSHELL_HEADER_HEIGHT }}
      navbar={{
        width: APPSHELL_NAVBAR_WIDTH,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <Header opened={opened} toggle={toggle} />
      <Navbar />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})
