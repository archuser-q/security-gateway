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
import { Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSSLListQueryOptions, useSSLList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { ListSearchBox } from '@/components/page/ListSearchBox';
import { ListTableCard } from '@/components/page/ListTableCard';
import PageHeader from '@/components/page/PageHeader';
import { StatusBadge } from '@/components/page/StatusBadge';
import { StatusFilterTabs } from '@/components/page/StatusFilterTabs';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { useListTablePagination } from '@/components/page/useListTablePagination';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_SSLS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { type CertInfo,parseCertInfo } from '@/utils/certParser';
import { filterByStatus, type StatusFilterValue } from '@/utils/statusFilter';
import IconArrowRight from '~icons/material-symbols/arrow-right-alt';

type SSLListItem = APISIXType['RespSSLItem'] & { certInfo: CertInfo | null };

const formatDate = (d: Date) =>
  `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;

const ExpiryTag = ({ info }: { info: CertInfo | null }) => {
  const { t } = useTranslation();
  if (!info) return <>-</>;
  const daysLeft = Math.floor(
    (info.notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return <Tag color="red">{t('certDetail.expired')}</Tag>;
  if (daysLeft <= 30)
    return <Tag color="orange">{t('certDetail.daysLeft', { count: daysLeft })}</Tag>;
  return <Tag color="green">{t('certDetail.daysLeft', { count: daysLeft })}</Tag>;
};

const ValidUntilText = ({ info }: { info: CertInfo | null }) => {
  if (!info) return <>-</>;
  return <>{formatDate(info.notAfter)}</>;
};

const IssuerText = ({ info }: { info: CertInfo | null }) => {
  if (!info || !info.issuer.cn) return <>-</>;
  return <>{info.issuer.cn}</>;
};

const SansText = ({ info }: { info: CertInfo | null }) => {
  if (!info || info.sans.length === 0) return <>-</>;
  return <>{info.sans.join(', ')}</>;
};

function RouteComponent() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination } = useSSLList();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [search, setSearch] = useState('');

  // Parse DER 1 lần/cert duy nhất ở đây, thay vì để 3 cột
  // (Issuer/Valid Until/Expiry) tự gọi parseCertInfo() 3 lần trên cùng 1 dòng.
  const listWithCertInfo = useMemo<SSLListItem[]>(() => {
    return (data?.list ?? []).map((item) => ({
      ...item,
      certInfo: item.value.cert ? parseCertInfo(item.value.cert) : null,
    }));
  }, [data?.list]);

  // Khác với Routes (search theo name gọi thẳng APISIX Admin API), SSL
  // không có field "name" nên không có gì để server lọc hộ - search ở
  // đây lọc theo SNI ngay trên mảng đã tải, chỉ áp dụng cho trang dữ
  // liệu hiện đang có (đủ dùng vì số lượng SSL trong 1 trang thường nhỏ).
  const filteredList = useMemo(() => {
    const byStatus = filterByStatus(listWithCertInfo, statusFilter);
    if (!search.trim()) return byStatus;
    const q = search.trim().toLowerCase();
    return byStatus.filter((item) => {
      const sni = item.value.sni ?? '';
      const snis = item.value.snis?.join(' ') ?? '';
      const certSans = item.certInfo?.sans.join(' ') ?? '';
      const certCn = item.certInfo?.subject.cn ?? '';
      return `${sni} ${snis} ${certSans} ${certCn}`.toLowerCase().includes(q);
    });
  }, [listWithCertInfo, statusFilter, search]);

  const columns = useMemo<ProColumns<SSLListItem>[]>(() => {
    return [
      {
        dataIndex: ['value', 'status'],
        title: t('form.basic.status'),
        key: 'status',
        width: 110,
        render: (_, record) => <StatusBadge enabled={record.value.status !== 0} />,
      },
      {
        dataIndex: ['value', 'sni'],
        title: 'SNI',
        key: 'sni',
        valueType: 'text',
        render: (_, record) => {
          const sni = record.value.sni;
          const snis = record.value.snis;
          if (sni) return sni;
          if (snis && snis.length > 0) return snis.join(', ');
          return '-';
        },
      },
      {
        // Khác với cột SNI phía trên (đây là cấu hình APISIX dùng để match
        // request), SANs đọc thẳng từ trong file cert - 2 giá trị này có
        // thể không trùng nhau (vd người dùng gán SNI khác với SAN thật
        // trong cert). Traefik chỉ có 1 nguồn (đọc thẳng cert) nên chỉ có
        // 1 cột; APISIX có cả 2 nguồn nên tách riêng để không che mất
        // trường hợp lệch nhau.
        title: 'SANs',
        key: 'sans',
        render: (_, record) => <SansText info={record.certInfo} />,
      },
      {
        dataIndex: ['value', 'cert'],
        title: 'Issuer',
        key: 'issuer',
        render: (_, record) => <IssuerText info={record.certInfo} />,
      },
      {
        dataIndex: ['value', 'cert'],
        title: 'Valid Until',
        key: 'valid_until',
        width: 120,
        render: (_, record) => <ValidUntilText info={record.certInfo} />,
      },
      {
        dataIndex: ['value', 'cert'],
        title: 'Expiry',
        key: 'expiry',
        width: 130,
        render: (_, record) => <ExpiryTag info={record.certInfo} />,
      },
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        valueType: 'text',
      },
      {
        title: t('table.actions'),
        valueType: 'option',
        key: 'option',
        width: 140,
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/ssls/detail/$id"
            params={{ id: record.value.id }}
            variant="subtle"
            rightSection={<IconArrowRight />}
          />,
          <DeleteResourceBtn
            key="delete"
            name={t('ssls.singular')}
            target={record.value.id}
            api={`${API_SSLS}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [t, refetch]);
  return (
    <>
      <PageHeader title={t('sources.ssls')} />
      <AntdConfigProvider>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group gap="sm" wrap="wrap">
            <StatusFilterTabs value={statusFilter} onChange={setStatusFilter} />
            <ToAddPageBtn
              to="/ssls/add"
              label={t('info.add.title', { name: t('ssls.singular') })}
              variant="filled"
              color="teal"
              radius="xl"
            />
          </Group>
          <ListSearchBox
            value={search}
            onSearch={setSearch}
            placeholder="SNI..."
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
    </>
  );
}
export const Route = createFileRoute('/_authenticated/ssls/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getSSLListQueryOptions(deps)),
});
