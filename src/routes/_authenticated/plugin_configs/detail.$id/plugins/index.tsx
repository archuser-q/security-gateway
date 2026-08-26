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
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { getPluginConfigQueryOptions } from '@/apis/hooks';
import PageHeader from '@/components/page/PageHeader';
import { PluginConfigGrid } from '@/components/page/PluginConfigGrid';

// Nội dung chi tiết từng plugin (trước đây nằm ngay trong tab General) -
// tách sang tab riêng để tránh trang General dài ra khi 1 Plugin Config
// gộp nhiều plugin. Dùng chung PluginConfigGrid với tab Plugins mới của
// Route Detail.
function RouteComponent() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/plugin_configs/detail/$id' });

  const { data, isLoading } = useSuspenseQuery(getPluginConfigQueryOptions(id));
  const pluginEntries = Object.entries(data.value.plugins ?? {});

  return (
    <>
      <PageHeader title={t('form.plugins.label')} />
      {isLoading ? (
        <Skeleton height={200} />
      ) : pluginEntries.length === 0 ? (
        <Text size="sm" c="dimmed">
          -
        </Text>
      ) : (
        <PluginConfigGrid
          items={pluginEntries.map(([name, config]) => ({
            name,
            config: config as Record<string, unknown>,
          }))}
        />
      )}
    </>
  );
}

export const Route = createFileRoute('/_authenticated/plugin_configs/detail/$id/plugins/')({
  component: RouteComponent,
});
