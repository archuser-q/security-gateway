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


export type NavGroup = 'http' | 'management';

export type NavRoute = {
  to?: FileRouteTypes['to'];
  label: keyof Resources['en']['common']['sources'];
  icon: React.ElementType; 
  onClick?: () => void;
  group?: NavGroup;
};

export const navRoutes: NavRoute[] = [
  {
    to: '/overview',
    label: 'overview',
    icon: IconHome,
  },
  
  {
    to: '/routes',
    label: 'routes',
    icon: IconRoute,
    group: 'http',
  },
  {
    to: '/services',
    label: 'services',
    icon: IconServer,
    group: 'http',
  },
  {
    to: '/plugin_configs',
    label: 'pluginConfigs',
    icon: IconSettings,
    group: 'http',
  },

  {
    to: '/stream_routes',
    label: 'streamRoutes',
    icon: IconTopologyStar,
    group: 'management',
  },
  {
    to: '/upstreams',
    label: 'upstreams',
    icon: IconArrowMerge,
    group: 'management',
  },
  {
    to: '/consumers',
    label: 'consumers',
    icon: IconUserCog, 
    group: 'management',
  },
  {
    to: '/consumer_groups',
    label: 'consumerGroups',
    icon: IconUsers,
    group: 'management',
  },
  {
    to: '/ssls',
    label: 'ssls',
    icon: IconLock,
    group: 'management',
  },
  {
    to: '/global_rules',
    label: 'globalRules',
    icon: IconShield,
    group: 'management',
  },
  {
    to: '/plugin_metadata',
    label: 'pluginMetadata',
    icon: IconPuzzle,
    group: 'management',
  },
  {
    to: '/secrets',
    label: 'secrets',
    icon: IconKey,
    group: 'management',
  },
  {
    to: '/protos',
    label: 'protos',
    icon: IconCode,
    group: 'management',
  },
  {
    to: '/admins',
    label: 'admin',
    icon: IconUsers,
    group: 'management',
  },
  {
    to: '/log_histories',
    label: 'log',
    icon: IconServerBolt,
    group: 'management',
  },
  {
    to: '/login_histories',
    label: 'login',
    icon: IconShieldCheckFilled,
    group: 'management',
  }
];