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
  Badge,
  Card,
  Group,
  Loader,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  type TextProps,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, createLink } from '@tanstack/react-router';
import type { AxiosInstance } from 'axios';
import * as React from 'react';
import type { FC } from 'react';
import SystemMindMap from '@/components/chart/MindMap';
import { getAdminListReq } from '@/apis/admin';
import { getConsumerGroupListReq } from '@/apis/consumer_groups';
import { getConsumerListReq } from '@/apis/consumers';
import { getGlobalRuleListReq } from '@/apis/global_rules';
import { getPluginConfigListReq } from '@/apis/plugin_configs';
import { getProtoListReq } from '@/apis/protos';
import { getRouteListReq } from '@/apis/routes';
import { getSecretListReq } from '@/apis/secrets';
import { getServiceListReq } from '@/apis/services';
import { getSSLListReq } from '@/apis/ssls';
import { getUpstreamListReq } from '@/apis/upstreams';
import {
  API_STREAM_ROUTES,
  PAGE_SIZE_MAX,
  SKIP_INTERCEPTOR_HEADER,
} from '@/config/constant';
import { req } from '@/config/req';

const MantineTextLink = React.forwardRef<HTMLAnchorElement, TextProps>(
  (props, ref) => <Text ref={ref} {...props} />
);
MantineTextLink.displayName = 'MantineTextLink';
const ExploreLink = createLink(MantineTextLink);

type ResourceSummary = {
  total: number;
  active: number;
  disabled: number;
  hasStatus: boolean;
};

// Không phải resource nào của APISIX cũng có khái niệm bật/tắt (Consumer
// Groups, Global Rules, Plugin Configs, Secrets, Protos đều không có
// field `status`) - nên hàm này nhận vào 1 hàm lấy trạng thái tuỳ theo
// từng loại, thay vì giả định 1 khuôn dạng chung cho tất cả.
const summarize = <T,>(
  list: T[],
  getStatus: ((item: T) => boolean) | null
): ResourceSummary => {
  const total = list.length;
  if (!getStatus) {
    return { total, active: total, disabled: 0, hasStatus: false };
  }
  const disabled = list.filter((item) => !getStatus(item)).length;
  return { total, active: total - disabled, disabled, hasStatus: true };
};

const useResourceSummary = <T,>(
  key: string,
  listReq: (
    req: AxiosInstance,
    params: { page: number; page_size: number }
  ) => Promise<{ total: number; list: T[] }>,
  getStatus: ((item: T) => boolean) | null
) => {
  return useQuery({
    queryKey: ['overview', key],
    queryFn: async () => {
      const res = await listReq(req, { page: 1, page_size: PAGE_SIZE_MAX });
      return summarize(res.list, getStatus);
    },
  });
};

const useStreamRouteSummary = () => {
  return useQuery({
    queryKey: ['overview', 'stream_routes'],
    queryFn: async () => {
      try {
        const res = await req.get<
          undefined,
          { total: number; list: unknown[] }
        >(API_STREAM_ROUTES, {
          params: { page: 1, page_size: PAGE_SIZE_MAX },
          headers: { [SKIP_INTERCEPTOR_HEADER]: true },
        });
        return summarize(res.list, null);
      } catch {
        return { total: 0, active: 0, disabled: 0, hasStatus: false };
      }
    },
  });
};

type ResourceCardProps = {
  title: string;
  data?: ResourceSummary;
  isLoading: boolean;
  linkTo: string;
};

const ResourceCard: FC<ResourceCardProps> = ({
  title,
  data,
  isLoading,
  linkTo,
}) => {
  const sections = [];
  if (data && data.hasStatus && data.total > 0) {
    if (data.active > 0) {
      sections.push({ value: (data.active / data.total) * 100, color: 'teal' });
    }
    if (data.disabled > 0) {
      sections.push({ value: (data.disabled / data.total) * 100, color: 'gray' });
    }
  } else if (data && data.total > 0) {
    sections.push({ value: 100, color: 'blue' });
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="lg">
          {title}
        </Text>
        <ExploreLink to={linkTo} size="sm" c="blue" style={{ cursor: 'pointer' }}>
          Explore →
        </ExploreLink>
      </Group>
      {isLoading ? (
        <Loader size="sm" />
      ) : (
        <Group>
          <RingProgress
            size={110}
            thickness={12}
            roundCaps
            sections={sections}
            label={
              <Text ta="center" fw={700} size="lg">
                {data?.total ?? 0}
              </Text>
            }
          />
          {data?.hasStatus ? (
            <Stack gap={4}>
              <Group gap={6}>
                <Badge color="teal" variant="light" size="sm">
                  Active
                </Badge>
                <Text size="sm">{data?.active ?? 0}</Text>
              </Group>
              <Group gap={6}>
                <Badge color="gray" variant="light" size="sm">
                  Disabled
                </Badge>
                <Text size="sm">{data?.disabled ?? 0}</Text>
              </Group>
            </Stack>
          ) : (
            <Stack gap={4}>
              <Group gap={6}>
                <Badge color="blue" variant="light" size="sm">
                  Total
                </Badge>
                <Text size="sm">{data?.total ?? 0}</Text>
              </Group>
            </Stack>
          )}
        </Group>
      )}
    </Card>
  );
};

function OverviewPage() {
  const routes = useResourceSummary(
    'routes',
    getRouteListReq,
    (item) => item.value.status !== 0
  );
  const services = useResourceSummary(
    'services',
    getServiceListReq,
    (item) => item.value.status !== 0
  );
  const upstreams = useResourceSummary(
    'upstreams',
    getUpstreamListReq,
    (item) => item.value.status !== 0
  );
  const ssls = useResourceSummary(
    'ssls',
    getSSLListReq,
    (item) => item.value.status !== 0
  );
  const consumers = useResourceSummary(
    'consumers',
    getConsumerListReq,
    null
  );
  const streamRoutes = useStreamRouteSummary();

  const consumerGroups = useResourceSummary(
    'consumer_groups',
    getConsumerGroupListReq,
    null
  );
  const globalRules = useResourceSummary(
    'global_rules',
    (r) => getGlobalRuleListReq(r),
    null
  );
  const pluginConfigs = useResourceSummary(
    'plugin_configs',
    getPluginConfigListReq,
    null
  );
  const secrets = useResourceSummary('secrets', getSecretListReq, null);
  const protos = useResourceSummary('protos', getProtoListReq, null);
  const admins = useResourceSummary(
    'admins',
    getAdminListReq,
    (item) => item.status !== false
  );

  return (
    <Stack gap="xl">
      <SystemMindMap />

      <Title order={2}>System Overview</Title>

      <Title order={4} c="dimmed" tt="uppercase">
        HTTP
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <ResourceCard title="Routes" data={routes.data} isLoading={routes.isLoading} linkTo="/routes" />
        <ResourceCard title="Services" data={services.data} isLoading={services.isLoading} linkTo="/services" />
        <ResourceCard title="Upstreams" data={upstreams.data} isLoading={upstreams.isLoading} linkTo="/upstreams" />
        <ResourceCard title="SSL Certificates" data={ssls.data} isLoading={ssls.isLoading} linkTo="/ssls" />
        <ResourceCard title="Consumers" data={consumers.data} isLoading={consumers.isLoading} linkTo="/consumers" />
        <ResourceCard
          title="Consumer Groups"
          data={consumerGroups.data}
          isLoading={consumerGroups.isLoading}
          linkTo="/consumer_groups"
        />
      </SimpleGrid>

      <Title order={4} c="dimmed" tt="uppercase" mt="md">
        Stream (TCP / UDP)
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <ResourceCard
          title="Stream Routes"
          data={streamRoutes.data}
          isLoading={streamRoutes.isLoading}
          linkTo="/stream_routes"
        />
      </SimpleGrid>

      <Title order={4} c="dimmed" tt="uppercase" mt="md">
        Plugins & Rules
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <ResourceCard
          title="Global Rules"
          data={globalRules.data}
          isLoading={globalRules.isLoading}
          linkTo="/global_rules"
        />
        <ResourceCard
          title="Plugin Configs"
          data={pluginConfigs.data}
          isLoading={pluginConfigs.isLoading}
          linkTo="/plugin_configs"
        />
      </SimpleGrid>

      <Title order={4} c="dimmed" tt="uppercase" mt="md">
        Advanced
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <ResourceCard title="Secrets" data={secrets.data} isLoading={secrets.isLoading} linkTo="/secrets" />
        <ResourceCard title="Protos" data={protos.data} isLoading={protos.isLoading} linkTo="/protos" />
        <ResourceCard
          title="Administrators"
          data={admins.data}
          isLoading={admins.isLoading}
          linkTo="/admins"
        />
      </SimpleGrid>
    </Stack>
  );
}

export const Route = createFileRoute('/_authenticated/overview/')({
  component: OverviewPage,
});
