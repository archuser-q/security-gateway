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
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getConsumerGroupListQueryOptions, useConsumerGroupList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { ListSearchBox } from '@/components/page/ListSearchBox';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_CONSUMER_GROUPS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';

// Cùng cách hiển thị plugin dạng badge như Plugin Configs, vì
// ConsumerGroup bản chất CHÍNH LÀ PluginConfig (chỉ thiếu field name) -
// xem ConsumerGroup = APISIXPluginConfigs.PluginConfig.omit({name:true})
// trong types/schema/apisix/consumer_groups.ts. Không có cột Name vì
// resource này không có field đó (bản cũ có cột Name nhưng luôn rỗng vì
// đọc nhầm field không tồn tại - đã bỏ).
const PluginBadges = ({ plugins }: { plugins?: Record<string, unknown> }) => {
  const names = Object.keys(plugins ?? {});
  if (names.length === 0) return <>-</>;
  return (
    <Group gap={4} wrap="wrap">
      {names.map((name) => (
        <Badge key={name} variant="light" color="teal" size="sm">
          {name}
        </Badge>
      ))}
    </Group>
  );
};

function ConsumerGroupsList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination } = useConsumerGroupList();
  const [search, setSearch] = useState('');

  // ConsumerGroup không có field "name" nên server không có gì để lọc
  // theo tên - search ở đây lọc phía client theo ID/desc/tên plugin bên
  // trong (hữu ích thật: vd tìm nhanh "group nào đang dùng limit-count").
  const filteredList = useMemo(() => {
    if (!search.trim()) return data.list;
    const q = search.trim().toLowerCase();
    return data.list.filter((item) => {
      const id = item.value.id ?? '';
      const desc = item.value.desc ?? '';
      const pluginNames = Object.keys(item.value.plugins ?? {}).join(' ');
      return `${id} ${desc} ${pluginNames}`.toLowerCase().includes(q);
    });
  }, [data.list, search]);

  const columns = useMemo<ProColumns<APISIXType['RespConsumerGroupItem']>[]>(() => {
    return [
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        valueType: 'text',
      },
      {
        title: t('form.plugins.label'),
        key: 'plugins',
        render: (_, record) => <PluginBadges plugins={record.value.plugins} />,
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
        sorter: true,
        renderText: (text) => {
          if (!text) return '-';
          return new Date(Number(text) * 1000).toISOString();
        },
      },
      {
        title: t('table.actions'),
        valueType: 'option',
        key: 'option',
        width: 120,
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/consumer_groups/detail/$id"
            params={{ id: record.value.id }}
          />,
          <DeleteResourceBtn
            key="delete"
            name={t('consumerGroups.singular')}
            target={record.value.id}
            api={`${API_CONSUMER_GROUPS}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [refetch, t]);

  return (
    <AntdConfigProvider>
      <Group justify="flex-end" mb="sm">
        <ListSearchBox value={search} onSearch={setSearch} />
      </Group>
      <ProTable
        columns={columns}
        dataSource={filteredList}
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        pagination={pagination}
        cardProps={{ bodyStyle: { padding: 0 } }}
        toolbar={{
          menu: {
            type: 'inline',
            items: [
              {
                key: 'add',
                label: (
                  <ToAddPageBtn
                    key="add"
                    to="/consumer_groups/add"
                    label={t('info.add.title', {
                      name: t('consumerGroups.singular'),
                    })}
                  />
                ),
              },
            ],
          },
        }}
      />
    </AntdConfigProvider>
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.consumerGroups')} />
      <ConsumerGroupsList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/consumer_groups/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getConsumerGroupListQueryOptions(deps)),
});
