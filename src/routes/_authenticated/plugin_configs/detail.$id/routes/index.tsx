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
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { Badge } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getRouteListReq } from '@/apis/routes';
import { ListSearchBox } from '@/components/page/ListSearchBox';
import PageHeader from '@/components/page/PageHeader';
import { StatusFilterTabs } from '@/components/page/StatusFilterTabs';
import { ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { PAGE_SIZE_MAX } from '@/config/constant';
import { req } from '@/config/req';
import type { APISIXType } from '@/types/schema/apisix';
import { filterByStatus, type StatusFilterValue } from '@/utils/statusFilter';

// Theo góp ý của nhóm: thay vì nhét bảng "Used by Routes" thẳng vào tab
// General (dài vô hạn nếu nhiều Route dùng chung 1 Plugin Config, phá bố
// cục trang), tách hẳn ra 1 tab riêng dạng bảng đầy đủ - giống hệt cách
// Service Detail đã làm với tab Routes/Stream Routes. Không dùng chung
// component RouteList vì nó phân trang phía SERVER (dựa vào
// WithServiceIdFilter.filter.service_id) - chưa có gì xác nhận backend
// hỗ trợ lọc theo plugin_config_id tương tự, nên vẫn tải toàn bộ (giới
// hạn PAGE_SIZE_MAX) rồi lọc + phân trang phía client, an toàn hơn.
function RouteComponent() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/plugin_configs/detail/$id' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['plugin_config_routes_scan', id],
    queryFn: () => getRouteListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
  });

  const usingThisConfig = useMemo(
    () => (data?.list ?? []).filter((item) => item.value.plugin_config_id === id),
    [data?.list, id]
  );

  const filteredList = useMemo(() => {
    const byStatus = filterByStatus(usingThisConfig, statusFilter);
    if (!search.trim()) return byStatus;
    const q = search.trim().toLowerCase();
    return byStatus.filter((item) => {
      const name = item.value.name ?? '';
      const uri = item.value.uri ?? item.value.uris?.join(' ') ?? '';
      return `${name} ${uri}`.toLowerCase().includes(q);
    });
  }, [usingThisConfig, statusFilter, search]);

  const columns = useMemo<ProColumns<APISIXType['RespRouteItem']>[]>(
    () => [
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
        dataIndex: ['value', 'uri'],
        title: 'URI',
        key: 'uri',
        valueType: 'text',
        render: (_, record) => record.value.uri || record.value.uris?.join(', ') || '-',
      },
      {
        dataIndex: ['value', 'name'],
        title: t('form.basic.name'),
        key: 'name',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'priority'],
        title: t('form.routes.priority'),
        key: 'priority',
        width: 90,
        render: (_, record) => record.value.priority ?? 0,
      },
      {
        title: t('table.actions'),
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <ToDetailPageBtn to="/routes/detail/$id" params={{ id: record.value.id }} />
        ),
      },
    ],
    [t]
  );

  return (
    <>
      <PageHeader title={t('sources.routes')} />
      <AntdConfigProvider>
        <Group justify="space-between" mb="sm" wrap="wrap">
          <StatusFilterTabs value={statusFilter} onChange={setStatusFilter} />
          <ListSearchBox value={search} onSearch={setSearch} />
        </Group>
        <ProTable
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          loading={isLoading}
          search={false}
          options={false}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </AntdConfigProvider>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/plugin_configs/detail/$id/routes/')({
  component: RouteComponent,
});
