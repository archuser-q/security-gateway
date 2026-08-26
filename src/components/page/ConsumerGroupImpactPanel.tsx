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
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getConsumerListReq } from '@/apis/consumers';
import { RouteLinkAnchor } from '@/components/Btn';
import { PAGE_SIZE_MAX } from '@/config/constant';
import { req } from '@/config/req';

type ConsumerGroupImpactPanelProps = {
  groupId: string;
  /** tên các plugin mà Consumer Group này đang cấu hình */
  groupPluginNames: string[];
};

// APISIX merge plugin theo đúng thứ tự Consumer > Consumer Group (đã
// xác nhận qua tài liệu chính thức, không đoán) - nghĩa là nếu 1
// Consumer trong group tự đặt plugin trùng tên với plugin của group,
// cấu hình plugin đó của GROUP sẽ bị bỏ qua hoàn toàn cho riêng consumer
// đó, mà không có cảnh báo gì trên dashboard gốc. Đây là điểm dễ gây
// hiểu nhầm thật sự (tưởng cả group đang áp dụng 1 rule, nhưng thực ra
// vài consumer đang chạy luật riêng) - panel này chủ động phát hiện và
// báo trước, không đợi người dùng tự phát hiện qua production issue.
export const ConsumerGroupImpactPanel = ({
  groupId,
  groupPluginNames,
}: ConsumerGroupImpactPanelProps) => {
  const { t } = useTranslation();

  // Dùng chung queryKey với tab Consumers (consumer_groups/detail.$id/consumers)
  // để react-query chỉ tải 1 lần, không tải lại khi người dùng chuyển tab.
  const { data, isLoading } = useQuery({
    queryKey: ['consumer_group_consumers_scan', groupId],
    queryFn: () => getConsumerListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
  });

  const members = (data?.list ?? []).filter((item) => item.value.group_id === groupId);

  const overrides = members
    .map((item) => {
      const ownPluginNames = Object.keys(item.value.plugins ?? {});
      const overriddenNames = ownPluginNames.filter((n) => groupPluginNames.includes(n));
      return { username: item.value.username, overriddenNames };
    })
    .filter((m) => m.overriddenNames.length > 0);

  if (isLoading) {
    return (
      <Card withBorder radius="md" p="md" mb="md">
        <Group justify="center" py="sm">
          <Loader size="sm" />
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Text size="sm">
        {t('consumerGroupDetail.memberCount', { count: members.length })}
      </Text>
      {overrides.length > 0 && groupPluginNames.length > 0 && (
        <Alert color="orange" variant="light" mt="sm" p="xs">
          <Stack gap={4}>
            <Text size="xs" fw={600}>
              {t('consumerGroupDetail.overrideWarning', { count: overrides.length })}
            </Text>
            {overrides.map((m) => (
              <Group key={m.username} gap={6} wrap="wrap">
                <RouteLinkAnchor
                  to="/consumers/detail/$username"
                  params={{ username: m.username }}
                  size="xs"
                >
                  {m.username}
                </RouteLinkAnchor>
                {m.overriddenNames.map((name) => (
                  <Badge key={name} size="sm" variant="outline" color="orange">
                    {name}
                  </Badge>
                ))}
              </Group>
            ))}
          </Stack>
        </Alert>
      )}
    </Card>
  );
};
