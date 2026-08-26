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

// Tách "Plugin Details" ra 1 tab riêng thay vì nhét thẳng vào trang
// Overview - nếu Route gộp plugin từ nhiều nguồn (route/plugin config/
// service) thì danh sách card cấu hình sẽ không còn làm trang Overview
// dài ra nữa. Copy nguyên pattern detail.$id.tsx + detail.$id/index.tsx
// + detail.$id/<tab>/index.tsx đã dùng cho Plugin Config/Services.
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
        label: t('info.detail.title', { name: t('routes.singular') }),
      },
      {
        value: 'plugins',
        label: t('form.plugins.label'),
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
          to: v === defaultTab ? '/routes/detail/$id/' : `/routes/detail/$id/${v}/`,
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

export const Route = createFileRoute('/_authenticated/routes/detail/$id')({
  component: RouteComponent,
});
