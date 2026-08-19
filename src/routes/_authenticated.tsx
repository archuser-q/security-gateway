/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, isRedirect,Outlet, redirect } from '@tanstack/react-router'

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
      <AppShell.Main bg="gray.0">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    try{
      if (!context.auth.isAuthenticated) {
        throw redirect({
          to: '/login',
          search: { redirect: location.href },
        })
      }
    } catch(error){
      if (isRedirect(error)) throw error
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})
