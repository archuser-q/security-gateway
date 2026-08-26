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
import { Badge, Card, Group, Loader, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getRouteListReq } from '@/apis/routes';
import { ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { PAGE_SIZE_MAX } from '@/config/constant';
import { req } from '@/config/req';
import type { APISIXType } from '@/types/schema/apisix';

type UsedByRoutesPanelProps = {
  /** lọc theo field nào của Route trỏ tới resource đang xem, vd (route) => route.value.plugin_config_id === id */
  filter: (route: APISIXType['Route']) => boolean;
};

// Traefik có sẵn bảng "Used by routers" ngay trên trang chi tiết
// middleware vì Router -> Middleware là quan hệ 1 chiều đơn giản, tra
// ngược được thẳng từ dữ liệu router. APISIX không có API "cho tôi biết
// Route nào đang dùng plugin_config X" nên phải tự tải toàn bộ Route
// (tối đa PAGE_SIZE_MAX = 500, đủ cho quy mô đồ án) rồi lọc phía client.
// Không dùng useRouteList() có sẵn vì hook đó gắn với phân trang/URL của
// TRANG /routes - dùng nhầm sẽ làm rối search param của trang plugin
// config đang đứng.
export const UsedByRoutesPanel = ({ filter }: UsedByRoutesPanelProps) => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['used-by-routes-scan'],
    queryFn: () => getRouteListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
  });

  const usedBy = (data?.list ?? []).filter((item) => filter(item.value));

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Text fw={600} size="sm" mb="xs">
        {t('usedBy.routesTitle')}
      </Text>
      {isLoading ? (
        <Group py="md" justify="center">
          <Loader size="sm" />
        </Group>
      ) : usedBy.length === 0 ? (
        <Text size="sm" c="dimmed" py="md" ta="center">
          {t('usedBy.empty')}
        </Text>
      ) : (
        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('usedBy.status')}</Table.Th>
              <Table.Th>{t('usedBy.name')}</Table.Th>
              <Table.Th>URI</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {usedBy.map((item) => (
              <Table.Tr key={item.value.id}>
                <Table.Td>
                  {item.value.status === 0 ? (
                    <Badge color="gray" variant="light" size="sm">
                      {t('table.disabled')}
                    </Badge>
                  ) : (
                    <Badge color="teal" variant="light" size="sm">
                      {t('table.enabled')}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>{item.value.name || '-'}</Table.Td>
                <Table.Td>
                  <Text size="sm" ff="monospace">
                    {item.value.uri ?? item.value.uris?.join(', ') ?? '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <ToDetailPageBtn to="/routes/detail/$id" params={{ id: item.value.id }} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
};
