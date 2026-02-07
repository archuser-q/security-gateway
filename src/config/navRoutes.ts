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
  IconLogout
} from '@tabler/icons-react';

export type NavRoute = {
  to?: FileRouteTypes['to'];
  label: keyof Resources['en']['common']['sources'];
  icon: React.ElementType; 
  onClick?: () => void;
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
  },
  {
    to: '/routes',
    label: 'routes',
    icon: IconRoute,
  },
  {
    to: '/stream_routes',
    label: 'streamRoutes',
    icon: IconTopologyStar,
  },
  {
    to: '/upstreams',
    label: 'upstreams',
    icon: IconArrowMerge,
  },
  {
    to: '/consumers',
    label: 'consumers',
    icon: IconUserCog, 
  },
  {
    to: '/consumer_groups',
    label: 'consumerGroups',
    icon: IconUsers,
  },
  {
    to: '/ssls',
    label: 'ssls',
    icon: IconLock,
  },
  {
    to: '/global_rules',
    label: 'globalRules',
    icon: IconShield,
  },
  {
    to: '/plugin_metadata',
    label: 'pluginMetadata',
    icon: IconPuzzle,
  },
  {
    to: '/plugin_configs',
    label: 'pluginConfigs',
    icon: IconSettings,
  },
  {
    to: '/secrets',
    label: 'secrets',
    icon: IconKey,
  },
  {
    to: '/protos',
    label: 'protos',
    icon: IconCode,
  },
  {
    to: '/admins',
    label: 'admin',
    icon: IconUsers,
  },
  {
    label: 'logout',
    icon: IconLogout,
    onClick: () => {
      window.location.href = '/login';
    }
  }
];
