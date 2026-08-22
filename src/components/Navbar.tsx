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
import { AppShellNavbar, Badge, Divider, NavLink, ScrollArea, Text, type NavLinkProps } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createLink } from '@tanstack/react-router';
import type { FC } from 'react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { navRoutes, type NavGroup } from '@/config/navRoutes';
import { getResourceStatsReq } from '@/apis/stats';
import { req } from '@/config/req';

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

const COUNTABLE_PATHS = [
  '/services',
  '/routes',
  '/stream_routes',
  '/upstreams',
  '/consumers',
  '/consumer_groups',
  '/ssls',
  '/global_rules',
  '/plugin_configs',
  '/secrets',
  '/protos',
  '/admins',
] as const;

const useNavStats = () =>
  useQuery({
    queryKey: ['resource-stats'],
    queryFn: () => getResourceStatsReq(req),
    staleTime: 30_000,
    retry: false,
    throwOnError: false,
  });

const NavCountBadge = ({ to }: { to: string }) => {
  const enabled = (COUNTABLE_PATHS as readonly string[]).includes(to);
  const { data } = useNavStats();

  if (!enabled || !data) return null;

  const key = to.slice(1);
  const statsRecord = data as Record<string, { total: number; enabled: number; disabled: number }> | undefined;
  const total = statsRecord?.[key]?.total;
  if (typeof total !== 'number') return null;

  return (
    <Badge className="sg-navlink__badge" variant="light" color="gray" size="sm">
      {total}
    </Badge>
  );
};

const GROUP_LABELS: Record<NavGroup, string> = {
  traffic: 'Traffic',
  security: 'Security',
  configuration: 'Configuration',
};

export const Navbar = () => {
  const { t } = useTranslation();
  let lastGroup: NavGroup | undefined;

  return (
    <AppShellNavbar className="sg-navbar">
      <ScrollArea
        className="sg-navbar__scroll"
        type="hover"
        scrollbarSize={6}
        classNames={{ viewport: 'sg-navbar__viewport' }}
      >
        {navRoutes.map((route) => {
          const Icon = route.icon;
          const showGroupHeader = route.group && route.group !== lastGroup;
          lastGroup = route.group;

          const groupHeader = showGroupHeader && (
            <React.Fragment key={`${route.group}-header`}>
              <Divider my={4} />
              <Text className="sg-navgroup-label">{GROUP_LABELS[route.group as NavGroup]}</Text>
            </React.Fragment>
          );

          if (!route.to && route.onClick) {
            return (
              <React.Fragment key={route.label}>
                {groupHeader}
                <NavLink
                  className="sg-navlink"
                  label={t(`sources.${route.label}`)}
                  leftSection={<Icon size={20} stroke={1.5} />}
                  onClick={route.onClick}
                />
              </React.Fragment>
            );
          }
          if (route.to) {
            return (
              <React.Fragment key={route.to}>
                {groupHeader}
                <NavbarLink
                  className="sg-navlink"
                  to={route.to}
                  label={t(`sources.${route.label}`)}
                  leftSection={<Icon size={20} stroke={1.5} />}
                  rightSection={<NavCountBadge to={route.to} />}
                />
              </React.Fragment>
            );
          }

          return null;
        })}
      </ScrollArea>

      <style>{`
        .sg-navbar {
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          height: calc(100dvh - var(--app-shell-header-height, 60px));
          overflow: hidden;
        }
        .sg-navbar__scroll {
          flex: 1;
          min-height: 0;
        }
        .sg-navbar__scroll .sg-navbar__viewport > div {
          padding: 0 10px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sg-navgroup-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--mantine-color-gray-6, #868e96);
          padding: 6px 12px 2px;
        }
        .sg-navlink {
          border-radius: 8px;
          padding: 10px 12px;
        }
        .sg-navlink:hover {
          background: var(--mantine-color-gray-1, #f1f3f5);
        }
        .sg-navlink[data-active] {
          background: var(--mantine-color-blue-0, #e7f5ff);
        }
        .sg-navlink .mantine-NavLink-label {
          font-size: 14.5px;
          font-weight: 500;
        }
        .sg-navlink__badge {
          font-weight: 600;
        }
      `}</style>
    </AppShellNavbar>
  );
};