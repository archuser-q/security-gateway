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
import { createFileRoute } from '@tanstack/react-router';
import { Badge } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getUpstreamListQueryOptions, useUpstreamList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_UPSTREAMS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { nodeCount } from '@/utils/upstreamHelpers';

function RouteComponent() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination } = useUpstreamList();

  const columns = useMemo<
    ProColumns<APISIXType['RespUpstreamList']['data']['list'][number]>[]
  >(() => {
    return [
      {
        dataIndex: ['value', 'status'],
        title: t('form.basic.status'),
        key: 'status',
        width: 110,
        render: (_, record) =>
          record.value.status === 0 ? (
            <Badge status="default" text={t('form.basic.statusOption.0')} />
          ) : (
            <Badge status="success" text={t('form.basic.statusOption.1')} />
          ),
      },
      {
        dataIndex: ['value', 'name'],
        title: t('form.basic.name'),
        key: 'name',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'type'],
        title: t('form.upstreams.type'),
        key: 'type',
        valueType: 'text',
        renderText: (text) => text || '-',
      },
      {
        dataIndex: ['value', 'scheme'],
        title: t('form.upstreams.scheme'),
        key: 'scheme',
        valueType: 'text',
        renderText: (text) => text || '-',
      },
      {
        title: t('form.upstreams.nodes.title'),
        key: 'nodes',
        width: 100,
        render: (_, record) => nodeCount(record.value.nodes),
      },
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        width: 160,
        valueType: 'text',
      },
      {
        title: t('table.actions'),
        valueType: 'option',
        key: 'option',
        width: 120,
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/upstreams/detail/$id"
            params={{ id: record.value.id }}
          />,
          <DeleteResourceBtn
            key="delete"
            name={t('upstreams.singular')}
            target={record.value.id}
            api={`${API_UPSTREAMS}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [t, refetch]);

  return (
    <>
      <PageHeader title={t('sources.upstreams')} />
      <AntdConfigProvider>
        <ProTable
          columns={columns}
          dataSource={data?.list}
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
                      to="/upstreams/add"
                      label={t('info.add.title', {
                        name: t('upstreams.singular'),
                      })}
                    />
                  ),
                },
              ],
            },
          }}
        />
      </AntdConfigProvider>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/upstreams/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getUpstreamListQueryOptions(deps)),
});
