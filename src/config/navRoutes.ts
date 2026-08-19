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
import {
  IconArrowMerge,
  IconCode,
  IconHome,
  IconKey,
  IconLock,
  IconPuzzle,
  IconRoute,
  IconServer,
  IconServerBolt,
  IconSettings,
  IconShield,
  IconShieldCheckFilled,
  IconTopologyStar,
  IconUserCog,
  IconUsers} from '@tabler/icons-react';

import type { Resources } from '@/config/i18n';
import type { FileRouteTypes } from '@/routeTree.gen';

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
    to: '/log_histories',
    label: 'log',
    icon: IconServerBolt
  },
  {
    to: '/login_histories',
    label: 'login',
    icon: IconShieldCheckFilled
  }
];

// Traefik chỉ có ít mục vì dashboard của nó chỉ đọc (xem lại phần đã
// trao đổi trong chat): mọi cấu hình thật nằm ở labels/CRD/file, dashboard
// không có nút Thêm/Sửa/Xoá nên không cần nhiều trang. APISIX thì ngược
// lại - dashboard là kênh ghi cấu hình chính, nên KHÔNG thể bỏ bớt các
// mục bên dưới (mỗi mục là 1 resource type có thể tạo/sửa/xoá thật).
// Việc học theo Traefik ở đây là gom nhóm cho gọn mắt, không phải xoá bớt.
type NavGroupKey = 'traffic' | 'security' | 'configuration' | 'system';

// Path -> nhóm. Dùng navRoutes[].to làm khoá để không phải khai báo lại
// icon/label một lần nữa - tránh 2 danh sách bị lệch nhau khi có người
// thêm resource mới mà quên cập nhật cả 2 chỗ.
const NAV_GROUP_BY_PATH: Partial<Record<NonNullable<NavRoute['to']>, NavGroupKey>> = {
  '/services': 'traffic',
  '/routes': 'traffic',
  '/stream_routes': 'traffic',
  '/upstreams': 'traffic',
  '/consumers': 'security',
  '/consumer_groups': 'security',
  '/ssls': 'security',
  '/global_rules': 'configuration',
  '/plugin_metadata': 'configuration',
  '/plugin_configs': 'configuration',
  '/secrets': 'configuration',
  '/protos': 'configuration',
  '/admins': 'system',
  '/log_histories': 'system',
  '/login_histories': 'system',
};

export type NavGroup = {
  key: NavGroupKey;
  label: keyof Resources['en']['common']['navGroups'];
  items: NavRoute[];
};

const GROUP_ORDER: NavGroupKey[] = ['traffic', 'security', 'configuration', 'system'];

export const navGroups: NavGroup[] = GROUP_ORDER.map((key) => ({
  key,
  label: key,
  items: navRoutes.filter((route) => route.to && NAV_GROUP_BY_PATH[route.to] === key),
}));

// Mục không thuộc nhóm nào (hiện tại chỉ có Overview) hiển thị riêng ở
// đầu sidebar, giống cách Traefik để "Dashboard" đứng một mình phía trên
// nhóm HTTP/TCP/UDP/CERTIFICATES.
export const ungroupedNavRoutes: NavRoute[] = navRoutes.filter(
  (route) => !route.to || !NAV_GROUP_BY_PATH[route.to]
);
