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
import { useQuery } from '@tanstack/react-query';

import { getPluginConfigQueryOptions, getServiceQueryOptions } from '@/apis/hooks';
import type { APISIXType } from '@/types/schema/apisix';

export type EffectivePluginSource = 'route' | 'pluginConfig' | 'service';
export type EffectivePlugin = {
  name: string;
  config: Record<string, unknown>;
  source: EffectivePluginSource;
};

// Tách riêng logic gộp plugin (trước đây nằm nguyên trong
// RouteFlowDiagram của routes/detail.$id.tsx) để dùng chung cho cả sơ đồ
// flow (chỉ cần badge tóm tắt) lẫn tab Plugins mới (cần đủ config từng
// plugin) - tránh viết lại 2 lần cùng 1 thứ tự ưu tiên Route > Plugin
// Config > Service dễ bị lệch nhau giữa 2 nơi.
export const useRouteEffectivePlugins = (route: APISIXType['Route'] | undefined) => {
  const serviceId = route?.service_id;

  const serviceQuery = useQuery({
    ...getServiceQueryOptions(serviceId ?? ''),
    enabled: !!serviceId,
  });
  const service = serviceQuery.data?.value;

  const pluginConfigId = route?.plugin_config_id;
  const pluginConfigQuery = useQuery({
    ...getPluginConfigQueryOptions(pluginConfigId ?? ''),
    enabled: !!pluginConfigId,
  });

  const inlinePluginNames = Object.keys(route?.plugins ?? {});
  const referencedPluginNames = Object.keys(pluginConfigQuery.data?.value.plugins ?? {});
  const servicePluginNames = Object.keys(service?.plugins ?? {});
  const activeServicePluginNames = servicePluginNames.filter(
    (n) => !inlinePluginNames.includes(n) && !referencedPluginNames.includes(n)
  );
  const overriddenServicePluginNames = servicePluginNames.filter(
    (n) => inlinePluginNames.includes(n) || referencedPluginNames.includes(n)
  );
  const showPluginsBox =
    inlinePluginNames.length > 0 || !!pluginConfigId || servicePluginNames.length > 0;

  const effectivePlugins: EffectivePlugin[] = [];
  {
    const seen = new Set<string>();
    for (const [name, config] of Object.entries(route?.plugins ?? {})) {
      effectivePlugins.push({ name, config: config as Record<string, unknown>, source: 'route' });
      seen.add(name);
    }
    for (const [name, config] of Object.entries(pluginConfigQuery.data?.value.plugins ?? {})) {
      if (seen.has(name)) continue;
      effectivePlugins.push({
        name,
        config: config as Record<string, unknown>,
        source: 'pluginConfig',
      });
      seen.add(name);
    }
    for (const [name, config] of Object.entries(service?.plugins ?? {})) {
      if (seen.has(name)) continue;
      effectivePlugins.push({
        name,
        config: config as Record<string, unknown>,
        source: 'service',
      });
      seen.add(name);
    }
  }

  return {
    serviceId,
    serviceQuery,
    service,
    pluginConfigId,
    pluginConfigQuery,
    inlinePluginNames,
    referencedPluginNames,
    servicePluginNames,
    activeServicePluginNames,
    overriddenServicePluginNames,
    showPluginsBox,
    effectivePlugins,
  };
};
