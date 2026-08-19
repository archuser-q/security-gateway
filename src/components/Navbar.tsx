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
import { useAtomValue } from 'jotai';
import type { FC } from 'react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { API_HEADER_KEY, API_PREFIX, PAGE_SIZE_MIN } from '@/config/constant';
import { navRoutes, type NavGroup } from '@/config/navRoutes';
import { adminKeyAtom } from '@/stores/global';

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

/**
 * Resource paths that have a normal APISIX admin list endpoint
 * (`{ list, total }`). Routes not listed here (overview, plugin
 * metadata, log/login histories) simply render without a count badge.
 */
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

/**
 * Traefik-style item count badge (e.g. "Services  16").
 *
 * Deliberately uses a plain `fetch` instead of the shared `req` axios
 * instance: `req` has a global response interceptor that pops a red
 * notification for every failed request (see src/config/req.ts). A
 * decorative sidebar badge failing (missing permission, resource not
 * enabled, etc.) should never spam the whole app with error toasts,
 * so this request bypasses that interceptor entirely and just fails
 * silently — no badge is shown for that item. Uses page_size =
 * PAGE_SIZE_MIN because this backend rejects smaller values (400).
 */
const NavCountBadge = ({ to }: { to: string }) => {
  const adminKey = useAtomValue(adminKeyAtom);
  const enabled = (COUNTABLE_PATHS as readonly string[]).includes(to);

  const { data } = useQuery({
    queryKey: ['nav-count', to],
    queryFn: async () => {
      const res = await fetch(`${API_PREFIX}${to}?page=1&page_size=${PAGE_SIZE_MIN}`, {
        headers: { [API_HEADER_KEY]: adminKey },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      return typeof json?.total === 'number' ? json.total : null;
    },
    enabled,
    retry: false,
    staleTime: 30_000,
    throwOnError: false,
  });

  if (data === undefined || data === null) return null;

  return (
    <Badge className="sg-navlink__badge" variant="light" color="gray" size="sm">
      {data}
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