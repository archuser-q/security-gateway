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
import { AppShellNavbar, NavLink, type NavLinkProps, Stack, Text } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import type { FC } from 'react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { navGroups, type NavRoute, ungroupedNavRoutes } from '@/config/navRoutes';

const MantineLinkComponent = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  (props, ref) => {
    return <NavLink ref={ref} {...props} />;
  }
);
MantineLinkComponent.displayName = 'MantineLinkComponent';

const CreatedLinkComponent = createLink(MantineLinkComponent);

interface NavbarLinkProps extends NavLinkProps {
  to: string;
}

export const NavbarLink: FC<NavbarLinkProps> = (props) => {
  return <CreatedLinkComponent key={props.to} href={props.to} {...props} />;
};

const NavItem = ({ route }: { route: NavRoute }) => {
  const { t } = useTranslation();
  const Icon = route.icon;

  if (!route.to && route.onClick) {
    return (
      <NavLink
        label={t(`sources.${route.label}`)}
        leftSection={<Icon size={18} stroke={1.5} />}
        onClick={route.onClick}
      />
    );
  }
  if (route.to) {
    return (
      <NavbarLink
        to={route.to}
        label={t(`sources.${route.label}`)}
        leftSection={<Icon size={18} stroke={1.5} />}
      />
    );
  }
  return null;
};

// Nhãn nhóm nhỏ, viết hoa, màu nhạt - cùng tinh thần với các label
// "HTTP" / "TCP" / "UDP" / "CERTIFICATES" phía trên từng nhóm mục trong
// sidebar của Traefik. Không phải link, chỉ để phân vùng mắt nhìn.
const NavGroupLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    size="xs"
    fw={700}
    c="dimmed"
    tt="uppercase"
    px="md"
    pt="md"
    pb={4}
    style={{ letterSpacing: 0.5 }}
  >
    {children}
  </Text>
);

export const Navbar = () => {
  const { t } = useTranslation();

  return (
    <AppShellNavbar>
      <Stack gap={2}>
        {ungroupedNavRoutes.map((route) => (
          <NavItem key={route.to ?? route.label} route={route} />
        ))}

        {navGroups.map((group) =>
          group.items.length === 0 ? null : (
            <React.Fragment key={group.key}>
              <NavGroupLabel>{t(`navGroups.${group.label}`)}</NavGroupLabel>
              {group.items.map((route) => (
                <NavItem key={route.to ?? route.label} route={route} />
              ))}
            </React.Fragment>
          )
        )}
      </Stack>
    </AppShellNavbar>
  );
};

