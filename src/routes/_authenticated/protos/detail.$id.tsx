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

const defaultTab = 'detail';

const ProtoDetailTabs = () => {
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
        label: t('info.detail.title', { name: t('protos.singular') }),
      },
      {
        value: 'used-by',
        label: 'Used By',
      },
    ],
    [t]
  );

  return (
    <Tabs
      items={items}
      variant="default"
      classNames={{
        tab: 'group transition-all duration-300 ease-in-out aria-selected:text-blue-600',
        tabLabel:
          'transition-colors duration-300 ease-in-out group-aria-selected:text-blue-600',
      }}
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
              ? '/protos/detail/$id/'
              : `/protos/detail/$id/${v}/`,
          params: { id: id as string },
        });
      }}
    />
  );
};

function RouteComponent() {
  return (
    <>
      <ProtoDetailTabs />
      <Outlet />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/protos/detail/$id')({
  component: RouteComponent,
});
