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
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Badge, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getConsumerListReq } from '@/apis/consumers';
import { getConsumerGroupQueryOptions } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { ListSearchBox } from '@/components/page/ListSearchBox';
import PageHeader from '@/components/page/PageHeader';
import { ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_CONSUMERS, PAGE_SIZE_MAX } from '@/config/constant';
import { req } from '@/config/req';
import type { APISIXType } from '@/types/schema/apisix';

// Consumer không có status nên không cần StatusFilterTabs ở đây (khác
// Routes). Cùng lý do như tab Routes của Plugin Config: tải toàn bộ
// (giới hạn PAGE_SIZE_MAX) rồi lọc phía client theo group_id, vì chưa
// có gì xác nhận Admin API hỗ trợ lọc theo group_id ở server.
function RouteComponent() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/consumer_groups/detail/$id' });
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['consumer_group_consumers_scan', id],
    queryFn: () => getConsumerListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
  });

  // Cần biết group đang có plugin gì để so sánh phát hiện override -
  // dùng useQuery (không phải useSuspenseQuery) vì trang này có thể là
  // nơi người dùng vào thẳng qua URL mà không qua tab General trước.
  const { data: groupData } = useQuery(getConsumerGroupQueryOptions(id));
  const groupPluginNames = Object.keys(groupData?.value.plugins ?? {});

  const inThisGroup = useMemo(
    () => (data?.list ?? []).filter((item) => item.value.group_id === id),
    [data?.list, id]
  );

  const filteredList = useMemo(() => {
    if (!search.trim()) return inThisGroup;
    const q = search.trim().toLowerCase();
    return inThisGroup.filter((item) => {
      const username = item.value.username ?? '';
      const desc = item.value.desc ?? '';
      return `${username} ${desc}`.toLowerCase().includes(q);
    });
  }, [inThisGroup, search]);

  const columns = useMemo<ProColumns<APISIXType['RespConsumerItem']>[]>(
    () => [
      {
        dataIndex: ['value', 'username'],
        title: t('form.consumers.username'),
        key: 'username',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'desc'],
        title: t('form.basic.desc'),
        key: 'desc',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'update_time'],
        title: t('form.info.update_time'),
        key: 'update_time',
        valueType: 'dateTime',
        renderText: (text) => {
          if (!text) return '-';
          return new Date(Number(text) * 1000).toISOString();
        },
      },
      {
        title: t('consumerGroupDetail.overridesColumn'),
        key: 'overrides',
        render: (_, record) => {
          const ownNames = Object.keys(record.value.plugins ?? {});
          const overridden = ownNames.filter((n) => groupPluginNames.includes(n));
          if (overridden.length === 0) return '-';
          return (
            <Group gap={4} wrap="wrap">
              {overridden.map((name) => (
                <Badge key={name} size="sm" variant="outline" color="orange">
                  {name}
                </Badge>
              ))}
            </Group>
          );
        },
      },
      {
        title: t('table.actions'),
        key: 'actions',
        width: 120,
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/consumers/detail/$username"
            params={{ username: record.value.username }}
          />,
          <DeleteResourceBtn
            key="delete"
            name={t('consumers.singular')}
            target={record.value.username}
            api={`${API_CONSUMERS}/${record.value.username}`}
            onSuccess={refetch}
          />,
        ],
      },
    ],
    [t, refetch, groupPluginNames]
  );

  return (
    <>
      <PageHeader title={t('sources.consumers')} />
      <AntdConfigProvider>
        <Group justify="flex-end" mb="sm">
          <ListSearchBox value={search} onSearch={setSearch} />
        </Group>
        <ProTable
          columns={columns}
          dataSource={filteredList}
          rowKey="username"
          loading={isLoading}
          search={false}
          options={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </AntdConfigProvider>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/consumer_groups/detail/$id/consumers/')({
  component: RouteComponent,
});
