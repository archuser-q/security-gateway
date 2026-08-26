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
import { Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { getRouteQueryOptions } from '@/apis/hooks';
import { RouteLinkAnchor } from '@/components/Btn';
import PageHeader from '@/components/page/PageHeader';
import { PluginConfigGrid } from '@/components/page/PluginConfigGrid';
import { useRouteEffectivePlugins } from '@/utils/useRouteEffectivePlugins';

// Nội dung của khối "Plugin Details" cũ (trước đây nằm ngay dưới sơ đồ
// flow trong tab Overview) - tách sang tab riêng theo góp ý: nếu Route
// gộp nhiều plugin từ Route/Plugin Config/Service, danh sách card cấu
// hình không còn làm trang Overview dài ra nữa. Dùng chung
// useRouteEffectivePlugins với sơ đồ flow (không tính lại thứ tự ưu
// tiên Route > Plugin Config > Service lần 2), và PluginConfigGrid dùng
// chung với tab Plugins của Plugin Config Detail.
function RouteComponent() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/routes/detail/$id' });

  const { data: routeData, isLoading } = useQuery(getRouteQueryOptions(id));
  const { effectivePlugins, pluginConfigId, pluginConfigQuery, serviceId, service } =
    useRouteEffectivePlugins(routeData?.value);

  return (
    <>
      <PageHeader title={t('form.plugins.label')} />
      {isLoading ? (
        <Skeleton height={200} />
      ) : effectivePlugins.length === 0 ? (
        <Text size="sm" c="dimmed">
          {t('routeFlow.notConfigured')}
        </Text>
      ) : (
        <PluginConfigGrid
          items={effectivePlugins.map(({ name, config, source }) => ({
            name,
            config,
            meta:
              source === 'pluginConfig' ? (
                <Text size="xs" c="dimmed">
                  {t('form.plugins.viaPrefix')}{' '}
                  <RouteLinkAnchor
                    to="/plugin_configs/detail/$id"
                    params={{ id: pluginConfigId ?? '' }}
                    size="xs"
                  >
                    {pluginConfigQuery.data?.value.name || pluginConfigId}
                  </RouteLinkAnchor>
                </Text>
              ) : source === 'service' ? (
                <Text size="xs" c="dimmed">
                  {t('form.plugins.viaPrefix')}{' '}
                  <RouteLinkAnchor
                    to="/services/detail/$id"
                    params={{ id: serviceId ?? '' }}
                    size="xs"
                  >
                    {service?.name || serviceId}
                  </RouteLinkAnchor>
                </Text>
              ) : (
                <Text size="xs" c="dimmed">
                  {t('routeFlow.sourceRoute')}
                </Text>
              ),
          }))}
        />
      )}
    </>
  );
}

export const Route = createFileRoute('/_authenticated/routes/detail/$id/plugins/')({
  component: RouteComponent,
});
