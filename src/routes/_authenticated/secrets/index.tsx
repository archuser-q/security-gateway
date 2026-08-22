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
import { Group } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSecretListQueryOptions, useSecretList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { ListSearchBox } from '@/components/page/ListSearchBox';
import PageHeader from '@/components/page/PageHeader';
import { SecretManagerBadge } from '@/components/page/SecretManagerBadge';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_SECRETS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';

function SecretList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination } = useSecretList();
  const [search, setSearch] = useState('');

  // Secret không có field "name"/"desc" nên search lọc theo ID/manager
  // ngay trên mảng đã tải (giống lý do SSL/Plugin Config làm client-side
  // thay vì gọi setParams).
  const filteredList = useMemo(() => {
    const list = data?.list || [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((item) =>
      `${item.value.id} ${item.value.manager}`.toLowerCase().includes(q)
    );
  }, [data?.list, search]);

  const columns = useMemo<
    ProColumns<APISIXType['RespSecretList']['data']['list'][number]>[]
  >(() => {
    return [
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        valueType: 'text',
        width: 300,
      },
      {
        title: t('form.secrets.manager'),
        key: 'manager',
        width: 120,
        render: (_, record) => <SecretManagerBadge manager={record.value.manager} />,
      },
      {
        title: t('table.actions'),
        valueType: 'option',
        key: 'option',
        width: 120,
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/secrets/detail/$manager/$id"
            params={{
              manager: record.value.manager,
              id: record.value.id,
            }}
          />,
          <DeleteResourceBtn
            key="delete"
            name={t('secrets.singular')}
            target={record.value.id}
            api={`${API_SECRETS}/${record.value.manager}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [t, refetch]);

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
                    to="/secrets/add"
                    label={t('info.add.title', { name: t('secrets.singular') })}
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
      <PageHeader title={t('sources.secrets')} />
      <SecretList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/secrets/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getSecretListQueryOptions(deps)),
});
