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
import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSSLListQueryOptions, useSSLList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { PaginationBar } from '@/components/PaginationBar';
import { API_SSLS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { type CertInfo, parseCertInfo } from '@/utils/certParser';

type SSLListItem = APISIXType['RespSSLItem'] & { certInfo: CertInfo | null };
type StatusFilter = 'all' | 'enabled' | 'disabled';

const formatDate = (d: Date) =>
  `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;

const EXPIRY_COLORS: Record<'expired' | 'soon' | 'ok', string> = {
  expired: 'bg-red-50 text-red-600',
  soon: 'bg-orange-50 text-orange-600',
  ok: 'bg-green-50 text-green-600',
};

const ExpiryTag = ({ info }: { info: CertInfo | null }) => {
  const { t } = useTranslation();
  if (!info) return <>-</>;
  const daysLeft = Math.floor(
    (info.notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const kind = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'soon' : 'ok';
  const label =
    daysLeft < 0
      ? t('certDetail.expired')
      : t('certDetail.daysLeft', { count: daysLeft });
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${EXPIRY_COLORS[kind]}`}
    >
      {label}
    </span>
  );
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
    let list = listWithCertInfo;
    if (statusFilter !== 'all') {
      list = list.filter((item) => {
        const isEnabled = item.value.status !== 0;
        return statusFilter === 'enabled' ? isEnabled : !isEnabled;
      });
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((item) => {
      const sni = item.value.sni ?? '';
      const snis = item.value.snis?.join(' ') ?? '';
      const certSans = item.certInfo?.sans.join(' ') ?? '';
      const certCn = item.certInfo?.subject.cn ?? '';
      return `${sni} ${snis} ${certSans} ${certCn}`.toLowerCase().includes(q);
    });
  }, [listWithCertInfo, statusFilter, search]);

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('info.status.all', 'All status') },
    { key: 'enabled', label: t('table.enabled') },
    { key: 'disabled', label: t('table.disabled') },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t('sources.ssls')} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.key
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <ToAddPageBtn
            to="/ssls/add"
            label={t('info.add.title', { name: t('ssls.singular') })}
          />
        </div>

        <div className="relative w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SNI..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm
                       placeholder:text-gray-400 focus:border-teal-500 focus:outline-none
                       focus:ring-1 focus:ring-teal-500"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left font-normal">{t('form.basic.status')}</th>
              <th className="px-4 py-3 text-left font-normal">SNI</th>
              <th className="px-4 py-3 text-left font-normal">SANs</th>
              <th className="px-4 py-3 text-left font-normal">Issuer</th>
              <th className="px-4 py-3 text-left font-normal">Valid Until</th>
              <th className="px-4 py-3 text-left font-normal">Expiry</th>
              <th className="px-4 py-3 text-left font-normal">ID</th>
              <th className="px-4 py-3 text-right font-normal">{t('table.actions')}</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              filteredList.map((record) => {
                const { id, sni, snis, status } = record.value;
                const isEnabled = status !== 0;

                return (
                  <tr
                    key={id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3">
                      {isEnabled ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-black">{t('table.enabled')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span className="text-black">{t('table.disabled')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sni || (snis && snis.length > 0 ? snis.join(', ') : '-')}
                    </td>
                    <td className="px-4 py-3">
                      <SansText info={record.certInfo} />
                    </td>
                    <td className="px-4 py-3">
                      <IssuerText info={record.certInfo} />
                    </td>
                    <td className="px-4 py-3">
                      <ValidUntilText info={record.certInfo} />
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryTag info={record.certInfo} />
                    </td>
                    <td className="px-4 py-3 font-mono">{id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <ToDetailPageBtn to="/ssls/detail/$id" params={{ id }} />
                        <DeleteResourceBtn
                          name={t('ssls.singular')}
                          target={id}
                          api={`${API_SSLS}/${id}`}
                          onSuccess={refetch}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && <PaginationBar pagination={pagination} />}
    </div>
  );
}
export const Route = createFileRoute('/_authenticated/ssls/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getSSLListQueryOptions(deps)),
});
