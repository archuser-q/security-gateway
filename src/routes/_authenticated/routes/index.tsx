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
import { Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getRouteListQueryOptions, useRouteList } from '@/apis/hooks';
import type { WithServiceIdFilter } from '@/apis/routes';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { ListSearchBox } from '@/components/page/ListSearchBox';
import { ListTableCard } from '@/components/page/ListTableCard';
import PageHeader from '@/components/page/PageHeader';
import { StatusBadge } from '@/components/page/StatusBadge';
import { StatusFilterTabs } from '@/components/page/StatusFilterTabs';
import { ToAddPageBtn, type ToAddPageBtnProps,ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { useListTablePagination } from '@/components/page/useListTablePagination';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_ROUTES } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { filterByStatus, type StatusFilterValue } from '@/utils/statusFilter';
import type { ListPageKeys } from '@/utils/useTablePagination';
import IconArrowRight from '~icons/material-symbols/arrow-right-alt';

export type RouteListProps = {
  routeKey: Extract<ListPageKeys, '/_authenticated/routes/' | '/_authenticated/services/detail/$id/routes/'>;
  defaultParams?: Partial<WithServiceIdFilter>;
  ToDetailBtn: (props: {
    record: APISIXType['RespRouteItem'];
  }) => React.ReactNode;
};

export const RouteList = (props: RouteListProps) => {
  const { routeKey, ToDetailBtn, defaultParams } = props;
  const { data, isLoading, refetch, pagination, params, setParams } =
    useRouteList(routeKey, defaultParams);
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');

  // name được APISIX Admin API hỗ trợ lọc thật sự ở server (đã có sẵn
  // trong WithServiceIdFilter/pageSearchSchema từ trước), nên search
  // theo tên/URI ở đây gọi thẳng setParams thay vì tự lọc mảng đã tải -
  // đúng resource lớn, phân trang, vẫn ra kết quả đúng trên toàn bộ dữ
  // liệu chứ không chỉ trang hiện tại.
  const filteredList = useMemo(
    () => filterByStatus(data.list, statusFilter),
    [data.list, statusFilter]
  );

  const serviceId = defaultParams?.filter?.service_id;
  const addRoute = serviceId
    ? `/services/detail/${serviceId}/routes/add`
    : '/routes/add';

  const columns = useMemo<ProColumns<APISIXType['RespRouteItem']>[]>(() => {
    return [
      {
        dataIndex: ['value', 'status'],
        title: t('form.basic.status'),
        key: 'status',
        width: 110,
        render: (_, record) => <StatusBadge enabled={record.value.status !== 0} />,
      },
      {
        dataIndex: ['value', 'uri'],
        title: 'URI',
        key: 'uri',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'name'],
        title: t('form.basic.name'),
        key: 'name',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'methods'],
        title: t('form.routes.methods'),
        key: 'methods',
        width: 220,
        render: (_, record) =>
          record.value.methods?.length ? (
            <Space size={4} wrap>
              {record.value.methods.map((m) => (
                <Tag key={m}>{m}</Tag>
              ))}
            </Space>
          ) : (
            '-'
          ),
      },
      {
        dataIndex: ['value', 'priority'],
        title: t('form.routes.priority'),
        key: 'priority',
        width: 90,
        render: (_, record) => record.value.priority ?? 0,
      },
      {
        dataIndex: ['value', 'service_id'],
        title: t('form.routes.service'),
        key: 'service_id',
        width: 140,
        render: (_, record) => record.value.service_id || '-',
      },
      {
        dataIndex: ['value', 'create_time'],
        title: t('form.routes.createTime'),
        key: 'create_time',
        width: 170,
        valueType: 'dateTime',
        renderText: (text) => {
          if (!text) return '-';
          return new Date(Number(text) * 1000).toISOString();
        },
      },
      {
        dataIndex: ['value', 'created_by'],
        title: t('form.basic.created_by'),
        key: 'created_by',
        valueType: 'text',
        renderText: (text) => text || '-',
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
        width: 140,
        render: (_, record) => [
          <ToDetailBtn key="detail" record={record} />,
          <DeleteResourceBtn
            key="delete"
            name={t('routes.singular')}
            target={record.value.id}
            api={`${API_ROUTES}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [t, ToDetailBtn, refetch]);

  return (
    <AntdConfigProvider>
      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="sm" wrap="wrap">
          <StatusFilterTabs value={statusFilter} onChange={setStatusFilter} />
          <ToAddPageBtn
            label={t('info.add.title', { name: t('routes.singular') })}
            to={addRoute as ToAddPageBtnProps['to']}
            variant="filled"
            color="teal"
            radius="xl"
          />
        </Group>
        <ListSearchBox
          value={params?.name}
          onSearch={(v) =>
            setParams({ name: v || undefined, page: 1 } as Partial<WithServiceIdFilter>)
          }
          placeholder={t('table.searchPlaceholder')}
          w={300}
        />
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
    </AntdConfigProvider>
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.routes')} />
      <RouteList
        routeKey="/_authenticated/routes/"
        ToDetailBtn={({ record }) => (
          <ToDetailPageBtn
            key="detail"
            to="/routes/detail/$id"
            params={{ id: record.value.id }}
            variant="subtle"
            rightSection={<IconArrowRight />}
          />
        )}
      />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/routes/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getRouteListQueryOptions(deps)),
});
