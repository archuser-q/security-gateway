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
import type { Resources } from '@/config/i18n';
import type { FileRouteTypes } from '@/routeTree.gen';

import {
  IconServer,
  IconRoute,
  IconTopologyStar,
  IconArrowMerge,
  IconUsers,
  IconUserCog,
  IconLock,
  IconShield,
  IconPuzzle,
  IconSettings,
  IconKey,
  IconCode,
  IconHome,
  IconServerBolt,
  IconShieldCheckFilled
} from '@tabler/icons-react';

export type NavGroup = 'traffic' | 'security' | 'configuration';

export type NavRoute = {
  to?: FileRouteTypes['to'];
  label: keyof Resources['en']['common']['sources'];
  icon: React.ElementType; 
  onClick?: () => void;
  /** Sidebar section this item belongs to. Omit for ungrouped items (e.g. Overview) shown at the top. */
  group?: NavGroup;
};

export const navRoutes: NavRoute[] = [
  {
    to: '/overview',
    label: 'overview',
    icon: IconHome,
  },
  {
    to: '/services',
    label: 'services',
    icon: IconServer,
    group: 'traffic',
  },
  {
    to: '/routes',
    label: 'routes',
    icon: IconRoute,
    group: 'traffic',
  },
  {
    to: '/stream_routes',
    label: 'streamRoutes',
    icon: IconTopologyStar,
    group: 'traffic',
  },
  {
    to: '/upstreams',
    label: 'upstreams',
    icon: IconArrowMerge,
    group: 'traffic',
  },
  {
    to: '/consumers',
    label: 'consumers',
    icon: IconUserCog, 
    group: 'security',
  },
  {
    to: '/consumer_groups',
    label: 'consumerGroups',
    icon: IconUsers,
    group: 'security',
  },
  {
    to: '/ssls',
    label: 'ssls',
    icon: IconLock,
    group: 'security',
  },
  {
    to: '/global_rules',
    label: 'globalRules',
    icon: IconShield,
    group: 'configuration',
  },
  {
    to: '/plugin_metadata',
    label: 'pluginMetadata',
    icon: IconPuzzle,
    group: 'configuration',
  },
  {
    to: '/plugin_configs',
    label: 'pluginConfigs',
    icon: IconSettings,
    group: 'configuration',
  },
  {
    to: '/secrets',
    label: 'secrets',
    icon: IconKey,
    group: 'configuration',
  },
  {
    to: '/protos',
    label: 'protos',
    icon: IconCode,
    group: 'configuration',
  },
  {
    to: '/admins',
    label: 'admin',
    icon: IconUsers,
    group: 'configuration',
  },
  {
    to: '/log_histories',
    label: 'log',
    icon: IconServerBolt,
    group: 'configuration',
  },
  {
    to: '/login_histories',
    label: 'login',
    icon: IconShieldCheckFilled,
    group: 'configuration',
  }
];