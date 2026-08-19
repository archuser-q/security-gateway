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
import { Badge, Empty, Space, Tag } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getServiceListQueryOptions, useServiceList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_SERVICES } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { nodeCount } from '@/utils/upstreamHelpers';
const ServiceList = () => {
  const { data, isLoading, refetch, pagination } = useServiceList();
  const { t } = useTranslation();
  const columns = useMemo<ProColumns<APISIXType['RespServiceItem']>[]>(() => {
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
        dataIndex: ['value', 'hosts'],
        title: t('form.services.hosts'),
        key: 'hosts',
        render: (_, record) =>
          record.value.hosts?.length ? (
            <Space size={4} wrap>
              {record.value.hosts.map((h) => (
                <Tag key={h}>{h}</Tag>
              ))}
            </Space>
          ) : (
            '-'
          ),
      },
      {
        dataIndex: ['value', 'upstream_id'],
        title: t('form.upstreams.title'),
        key: 'upstream',
        render: (_, record) =>
          record.value.upstream_id ||
          (record.value.upstream ? t('form.upstreams.inline') : '-')
      },
      {
        title: t('form.upstreams.nodes.title'),
        key: 'servers',
        width: 100,
        render: (_, record) => nodeCount(record.value.upstream?.nodes),
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
            to="/services/detail/$id"
            params={{ id: record.value.id }}
          />,
          <DeleteResourceBtn
            key="delete"
            name={t('services.singular')}
            target={record.value.id}
            api={`${API_SERVICES}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [t, refetch]);
  return (
    <AntdConfigProvider>
      <ProTable
        locale={{
          emptyText: (
            <Empty
              description={t('services.empty')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
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
                    label={t('info.add.title', {
                      name: t('services.singular'),
                    })}
                    to="/services/add"
                  />
                ),
              },
            ],
          },
        }}
      />
    </AntdConfigProvider>
  );
};
function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.services')} />
      <AntdConfigProvider>
        <ServiceList />
      </AntdConfigProvider>
    </>
  );
}
export const Route = createFileRoute('/_authenticated/services/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getServiceListQueryOptions(deps)),
});
