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
import { Alert, Badge, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getConsumerGroupListReq } from '@/apis/consumer_groups';
import { getConsumerListReq } from '@/apis/consumers';
import { getGlobalRuleListReq } from '@/apis/global_rules';
import { getPluginConfigListReq } from '@/apis/plugin_configs';
import { getRouteListReq } from '@/apis/routes';
import { getServiceListReq } from '@/apis/services';
import { RouteLinkAnchor } from '@/components/Btn';
import { PAGE_SIZE_MAX } from '@/config/constant';
import { req } from '@/config/req';
import { buildSecretRefPrefix, containsSecretRef } from '@/utils/secretRefScanner';

type Match = {
  type: 'route' | 'service' | 'consumer' | 'consumerGroup' | 'pluginConfig' | 'globalRule';
  id: string;
  label: string;
};

const MatchLink = ({ match, typeLabel }: { match: Match; typeLabel: string }) => {
  const linkProps = (() => {
    switch (match.type) {
      case 'route':
        return (
          <RouteLinkAnchor to="/routes/detail/$id" params={{ id: match.id }} size="sm">
            {match.label}
          </RouteLinkAnchor>
        );
      case 'service':
        return (
          <RouteLinkAnchor to="/services/detail/$id" params={{ id: match.id }} size="sm">
            {match.label}
          </RouteLinkAnchor>
        );
      case 'consumer':
        return (
          <RouteLinkAnchor
            to="/consumers/detail/$username"
            params={{ username: match.id }}
            size="sm"
          >
            {match.label}
          </RouteLinkAnchor>
        );
      case 'consumerGroup':
        return (
          <RouteLinkAnchor to="/consumer_groups/detail/$id" params={{ id: match.id }} size="sm">
            {match.label}
          </RouteLinkAnchor>
        );
      case 'pluginConfig':
        return (
          <RouteLinkAnchor to="/plugin_configs/detail/$id" params={{ id: match.id }} size="sm">
            {match.label}
          </RouteLinkAnchor>
        );
      case 'globalRule':
        return (
          <RouteLinkAnchor to="/global_rules/detail/$id" params={{ id: match.id }} size="sm">
            {match.label}
          </RouteLinkAnchor>
        );
    }
  })();

  return (
    <Group justify="space-between" wrap="nowrap">
      <Badge size="sm" variant="light">
        {typeLabel}
      </Badge>
      {linkProps}
    </Group>
  );
};

// Đây chính là khối "Used By"/"Associated Resources" mà Gemini đề xuất -
// đồng ý đây là ý đúng và quan trọng thật (tránh xoá nhầm 1 Secret đang
// được dùng). Nhưng khác với Plugin Config (có field plugin_config_id
// tham chiếu thẳng), Secret được nhúng dưới dạng CHUỖI tự do trong plugin
// config bất kỳ - nên đây là quét toàn bộ (best-effort), không phải tra
// cứu chính xác tuyệt đối như DB có khoá ngoại thật.
export const SecretUsedByPanel = ({ manager, id }: { manager: string; id: string }) => {
  const { t } = useTranslation();
  const prefix = buildSecretRefPrefix(manager, id);

  const results = useQueries({
    queries: [
      {
        queryKey: ['secret_scan_routes', manager, id],
        queryFn: () => getRouteListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
      },
      {
        queryKey: ['secret_scan_services', manager, id],
        queryFn: () => getServiceListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
      },
      {
        queryKey: ['secret_scan_consumers', manager, id],
        queryFn: () => getConsumerListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
      },
      {
        queryKey: ['secret_scan_consumer_groups', manager, id],
        queryFn: () => getConsumerGroupListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
      },
      {
        queryKey: ['secret_scan_plugin_configs', manager, id],
        queryFn: () => getPluginConfigListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
      },
      {
        queryKey: ['secret_scan_global_rules', manager, id],
        queryFn: () => getGlobalRuleListReq(req),
      },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);
  const [routesQ, servicesQ, consumersQ, groupsQ, pluginConfigsQ, globalRulesQ] = results;

  const matches: Match[] = [];
  for (const item of routesQ.data?.list ?? []) {
    if (containsSecretRef(item.value.plugins, prefix)) {
      matches.push({ type: 'route', id: item.value.id, label: item.value.name || item.value.id });
    }
  }
  for (const item of servicesQ.data?.list ?? []) {
    if (containsSecretRef(item.value.plugins, prefix)) {
      matches.push({
        type: 'service',
        id: item.value.id,
        label: item.value.name || item.value.id,
      });
    }
  }
  for (const item of consumersQ.data?.list ?? []) {
    if (containsSecretRef(item.value.plugins, prefix)) {
      matches.push({ type: 'consumer', id: item.value.username, label: item.value.username });
    }
  }
  for (const item of groupsQ.data?.list ?? []) {
    if (containsSecretRef(item.value.plugins, prefix)) {
      matches.push({ type: 'consumerGroup', id: item.value.id, label: item.value.id });
    }
  }
  for (const item of pluginConfigsQ.data?.list ?? []) {
    if (containsSecretRef(item.value.plugins, prefix)) {
      matches.push({
        type: 'pluginConfig',
        id: item.value.id,
        label: item.value.name || item.value.id,
      });
    }
  }
  for (const item of globalRulesQ.data?.list ?? []) {
    if (containsSecretRef(item.value.plugins, prefix)) {
      matches.push({ type: 'globalRule', id: item.value.id, label: item.value.id });
    }
  }

  const TYPE_LABEL: Record<Match['type'], string> = {
    route: t('sources.routes'),
    service: t('sources.services'),
    consumer: t('sources.consumers'),
    consumerGroup: t('sources.consumerGroups'),
    pluginConfig: t('sources.pluginConfigs'),
    globalRule: t('sources.globalRules'),
  };

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Text fw={600} size="sm" mb="xs">
        {t('secretDetail.usedByTitle')}
      </Text>
      {isLoading ? (
        <Group py="md" justify="center">
          <Loader size="sm" />
        </Group>
      ) : matches.length === 0 ? (
        <Text size="sm" c="dimmed" py="md" ta="center">
          {t('secretDetail.usedByEmpty')}
        </Text>
      ) : (
        <Stack gap={6}>
          {matches.map((m, i) => (
            <MatchLink key={`${m.type}-${i}`} match={m} typeLabel={TYPE_LABEL[m.type]} />
          ))}
        </Stack>
      )}
      <Alert color="yellow" variant="light" mt="sm" p="xs">
        <Text size="xs">{t('secretDetail.usedByDisclaimer')}</Text>
      </Alert>
    </Card>
  );
};
