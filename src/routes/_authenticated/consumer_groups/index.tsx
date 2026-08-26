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
<<<<<<< HEAD
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
=======
import { Group } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
>>>>>>> origin/tai
import { useTranslation } from 'react-i18next';

import { getConsumerGroupListQueryOptions, useConsumerGroupList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
<<<<<<< HEAD
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
=======
import { ListSearchBox } from '@/components/page/ListSearchBox';
import { ListTableCard } from '@/components/page/ListTableCard';
import PageHeader from '@/components/page/PageHeader';
import { PluginBadges } from '@/components/page/PluginBadges';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { useListTablePagination } from '@/components/page/useListTablePagination';
>>>>>>> origin/tai
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_CONSUMER_GROUPS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
<<<<<<< HEAD
=======
import IconArrowRight from '~icons/material-symbols/arrow-right-alt';
>>>>>>> origin/tai

function ConsumerGroupsList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination } = useConsumerGroupList();
<<<<<<< HEAD

  const columns = useMemo<
    ProColumns<APISIXType['RespConsumerGroupItem']>[]
  >(() => {
=======
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

  // Không có cột Name vì ConsumerGroup không có field đó (bản cũ có cột
  // Name nhưng luôn rỗng vì đọc nhầm field không tồn tại - đã bỏ). Badge
  // plugin dùng chung PluginBadges với Plugin Configs vì ConsumerGroup
  // bản chất CHÍNH LÀ PluginConfig (chỉ thiếu field name) - xem
  // ConsumerGroup = APISIXPluginConfigs.PluginConfig.omit({name:true})
  // trong types/schema/apisix/consumer_groups.ts.
  const columns = useMemo<ProColumns<APISIXType['RespConsumerGroupItem']>[]>(() => {
>>>>>>> origin/tai
    return [
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        valueType: 'text',
      },
      {
<<<<<<< HEAD
        dataIndex: ['value', 'name'],
        title: t('form.basic.name'),
        key: 'name',
        valueType: 'text',
=======
        title: t('form.plugins.label'),
        key: 'plugins',
        render: (_, record) => <PluginBadges plugins={record.value.plugins} />,
>>>>>>> origin/tai
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
<<<<<<< HEAD
        width: 120,
=======
        width: 140,
>>>>>>> origin/tai
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/consumer_groups/detail/$id"
            params={{ id: record.value.id }}
<<<<<<< HEAD
=======
            variant="subtle"
            rightSection={<IconArrowRight />}
>>>>>>> origin/tai
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
<<<<<<< HEAD
      <ProTable
        columns={columns}
        dataSource={data.list}
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
=======
      <Group justify="space-between" mb="md" wrap="wrap">
        <ToAddPageBtn
          to="/consumer_groups/add"
          label={t('info.add.title', { name: t('consumerGroups.singular') })}
          variant="filled"
          color="teal"
          radius="xl"
        />
        <ListSearchBox value={search} onSearch={setSearch} w={300} />
      </Group>
      <ListTableCard>
        <ProTable
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          loading={isLoading}
          search={false}
          options={false}
          pagination={useListTablePagination(pagination)}
          cardProps={{ bodyStyle: { padding: 0 } }}
        />
      </ListTableCard>
>>>>>>> origin/tai
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
