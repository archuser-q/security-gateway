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
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Tabs, type TabsItem } from '@/components/page/Tabs';

// Theo đúng góp ý của bạn trong nhóm: tách "Used by Routes" ra 1 tab
// riêng thay vì nhét thẳng vào trang General - nếu 1 Plugin Config bị
// hàng trăm Route dùng chung, bảng dài sẽ không còn làm hỏng bố cục
// trang General nữa vì nó nằm ở tab khác hẳn. Cấu trúc file này COPY
// nguyên pattern đã có sẵn ở Services (detail.$id.tsx + detail.$id/
// index.tsx + detail.$id/routes/index.tsx) - không phải kiểu mới bịa ra,
// dùng lại đúng cách team đã làm cho Services.
const defaultTab = 'detail';
export const DetailTabs = () => {
  const { t } = useTranslation();
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const items = useMemo(
    (): TabsItem[] => [
      {
        value: 'detail',
        label: t('info.detail.title', { name: t('pluginConfigs.singular') }),
      },
      {
        value: 'plugins',
        label: t('form.plugins.label'),
      },
      {
        value: 'routes',
        label: t('sources.routes'),
      },
    ],
    [t]
  );
  return (
    <Tabs
      items={items}
      variant="outline"
      value={
        items
          .slice()
          .reverse()
          .find((v) => pathname.includes(v.value))?.value || defaultTab
      }
      onChange={(v) => {
        navigate({
          to:
            v === defaultTab
              ? '/plugin_configs/detail/$id/'
              : `/plugin_configs/detail/$id/${v}/`,
          params: { id: id as string },
        });
      }}
    />
  );
};

function RouteComponent() {
  return (
    <>
      <DetailTabs />
      <Outlet />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/plugin_configs/detail/$id')({
  component: RouteComponent,
});
