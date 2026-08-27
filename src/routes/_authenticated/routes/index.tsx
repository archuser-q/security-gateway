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
import dayjs from 'dayjs';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getRouteListQueryOptions, useRouteList } from '@/apis/hooks';
import type { WithServiceIdFilter } from '@/apis/routes';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, type ToAddPageBtnProps, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { PaginationBar } from '@/components/PaginationBar';
import { API_ROUTES } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { useSearchParams } from '@/utils/useSearchParams';
import type { ListPageKeys } from '@/utils/useTablePagination';

type StatusFilter = 'all' | 'enabled' | 'disabled';

export type RouteListProps = {
  routeKey: Extract<ListPageKeys, '/_authenticated/routes/' | '/_authenticated/services/detail/$id/routes/'>;
  defaultParams?: Partial<WithServiceIdFilter>;
  ToDetailBtn: (props: {
    record: APISIXType['RespRouteItem'];
  }) => React.ReactNode;
};

export const RouteList = (props: RouteListProps) => {
  const { routeKey, ToDetailBtn, defaultParams } = props;
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination, setParams } =
    useRouteList(routeKey, defaultParams);

  // hooks.ts không trả `params` nữa (giống upstreams/admins) - tự lấy
  // qua useSearchParams bằng chính routeKey được truyền vào, vì RouteList
  // dùng chung cho cả /routes/ lẫn /services/detail/$id/routes/.
  const { params: rawParams } = useSearchParams<
    RouteListProps['routeKey'],
    WithServiceIdFilter
  >(routeKey);
  const params = pageSearchSchema.parse(rawParams);

  const [searchInput, setSearchInput] = useState(params.name ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    setSearchInput(params.name ?? '');
  }, [params.name]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (params.name ?? '')) {
        setParams({ name: searchInput || undefined, page: 1 } as Partial<WithServiceIdFilter>);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Status (enabled/disabled) lọc phía client trên trang dữ liệu hiện có
  // - giống Services/Admins - vì đây không phải field "status" của
  // pageSearchSchema (field đó dành cho active/inactive của Admin).
  const filteredList = useMemo(() => {
    if (statusFilter === 'all') return data.list;
    return data.list.filter((record) => {
      const isEnabled = record.value.status !== 0;
      return statusFilter === 'enabled' ? isEnabled : !isEnabled;
    });
  }, [data.list, statusFilter]);

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('info.status.all', 'All status') },
    { key: 'enabled', label: t('table.enabled') },
    { key: 'disabled', label: t('table.disabled') },
  ];

  const serviceId = defaultParams?.filter?.service_id;
  const addRoute = serviceId
    ? `/services/detail/${serviceId}/routes/add`
    : '/routes/add';

  return (
    <div className="space-y-4">
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
            to={addRoute as ToAddPageBtnProps['to']}
            label={t('info.add.title', { name: t('routes.singular') })}
          />
        </div>

        <div className="relative w-72">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('table.search', 'Search')}
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
              <th className="px-4 py-3 text-left font-normal">URI</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.basic.name')}</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.routes.methods')}</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.routes.priority')}</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.routes.service')}</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.routes.createTime')}</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.basic.created_by')}</th>
              <th className="px-4 py-3 text-left font-normal">ID</th>
              <th className="px-4 py-3 text-right font-normal">{t('table.actions')}</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              filteredList.map((record) => {
                const {
                  id,
                  uri,
                  uris,
                  name,
                  methods,
                  priority,
                  service_id,
                  create_time,
                  created_by,
                  status,
                } = record.value;
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
                    <td className="px-4 py-3">{uri || uris?.join(', ') || '-'}</td>
                    <td className="px-4 py-3">{name || '-'}</td>
                    <td className="px-4 py-3">
                      {methods?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {methods.map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">{priority ?? 0}</td>
                    <td className="px-4 py-3">{service_id || '-'}</td>
                    <td className="px-4 py-3">
                      {create_time ? dayjs(create_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '-'}
                    </td>
                    <td className="px-4 py-3">{created_by || '-'}</td>
                    <td className="px-4 py-3 font-mono">{id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <ToDetailBtn record={record} />
                        <DeleteResourceBtn
                          name={t('routes.singular')}
                          target={id}
                          api={`${API_ROUTES}/${id}`}
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
};

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.routes')} />
      <RouteList
        routeKey="/_authenticated/routes/"
        ToDetailBtn={({ record }) => (
          <ToDetailPageBtn to="/routes/detail/$id" params={{ id: record.value.id }} />
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
