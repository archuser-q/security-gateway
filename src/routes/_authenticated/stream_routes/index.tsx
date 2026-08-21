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
import { ChevronDown, ChevronsUpDown, ChevronUp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getStreamRouteListQueryOptions, useStreamRouteList } from '@/apis/hooks';
import type { WithServiceIdFilter } from '@/apis/routes';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { StreamRoutesErrorComponent } from '@/components/page-slice/stream_routes/ErrorComponent';
import { API_STREAM_ROUTES } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import type { ListPageKeys } from '@/utils/useTablePagination';
import { PaginationBar } from '@/components/PaginationBar';
import SortableHeader from '@/components/SortableHeader';

type SortKey = 'server_addr' | 'update_time' | null;
type SortDir = 'asc' | 'desc';

export type StreamRouteListProps = {
  routeKey: Extract<
    ListPageKeys,
    '/_authenticated/stream_routes/' | '/_authenticated/services/detail/$id/stream_routes/'
  >;
  ToDetailBtn: (props: {
    record: APISIXType['RespStreamRouteItem'];
  }) => React.ReactNode;
  defaultParams?: Partial<WithServiceIdFilter>;
};

/**
 * Reusable list — used both as the standalone "/stream_routes/" page
 * and embedded inside Service Detail's "Stream Routes" tab (via
 * routeKey + defaultParams.filter.service_id), same pattern RouteList
 * uses for Routes. Keep this signature stable: services/detail.$id/
 * stream_routes/index.tsx imports and calls it directly.
 *
 * Same visual language as Services/Global Rules/Plugin Configs/Protos
 * (Tailwind + lucide icons, black text, sortable headers, shared
 * Mantine ToAddPageBtn — not custom-styled). StreamRoute's schema
 * explicitly omits `name` and `status` (unlike Route/Service), so
 * there's no status filter row and ID stands in for Name. It does
 * have `plugins`, shown the same way as Global Rules/Plugin Configs.
 * Filtering/sorting stays client-side over the current page, same
 * reasoning as the other resources.
 */
export const StreamRouteList = (props: StreamRouteListProps) => {
  const { routeKey, ToDetailBtn, defaultParams } = props;
  const { data, isLoading, refetch, pagination } = useStreamRouteList(
    routeKey,
    defaultParams
  );
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const addTo = `${routeKey.replace('/_authenticated', '')}add` as Parameters<
    typeof ToAddPageBtn
  >[0]['to'];

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  const filteredList = useMemo(() => {
    let list = data.list;

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter((record) => {
        const { id, desc, server_addr, sni } = record.value;
        return [id, desc, server_addr, sni]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(kw));
      });
    }

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: string | number;
        let bv: string | number;
        if (sortKey === 'server_addr') {
          av = a.value.server_addr || a.value.id;
          bv = b.value.server_addr || b.value.id;
        } else {
          av = a.value.update_time || 0;
          bv = b.value.update_time || 0;
        }
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [data.list, keyword, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Toolbar — no status pill tabs: StreamRoute has no status field */}
      <div className="flex items-center justify-between gap-4">
        <ToAddPageBtn
          to={addTo}
          label={t('info.add.title', { name: t('streamRoutes.singular') })}
        />

        <div className="relative w-72">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
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
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-sm font-normal text-gray-700">ID</th>
              <SortableHeader
                label={t('form.streamRoutes.serverAddr')}
                active={sortKey === 'server_addr'}
                dir={sortKey === 'server_addr' ? sortDir : undefined}
                onClick={() => toggleSort('server_addr')}
              />
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.streamRoutes.serverPort')}
              </th>
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.streamRoutes.sni')}
              </th>
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.basic.desc')}
              </th>
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.plugins.label')}
              </th>
              <SortableHeader
                label={t('form.info.update_time')}
                active={sortKey === 'update_time'}
                dir={sortKey === 'update_time' ? sortDir : undefined}
                onClick={() => toggleSort('update_time')}
              />
              <th className="px-4 py-3 text-right font-normal text-sm text-gray-700">
                {t('table.actions')}
              </th>
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
                const { id, server_addr, server_port, sni, desc, plugins, update_time } =
                  record.value;
                const pluginNames = plugins ? Object.keys(plugins) : [];

                return (
                  <tr
                    key={id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-black">{id}</td>
                    <td className="px-4 py-3 text-black">{server_addr || '-'}</td>
                    <td className="px-4 py-3 text-black">{server_port ?? '-'}</td>
                    <td className="px-4 py-3 text-black">{sni || '-'}</td>
                    <td className="px-4 py-3 text-black">{desc || '-'}</td>
                    <td className="px-4 py-3">
                      {pluginNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {pluginNames.map((p) => (
                            <span
                              key={p}
                              className="rounded-full bg-orange-50 px-2.5 py-0.5 text-sm
                                         font-medium text-orange-600"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-black">
                      {update_time
                        ? new Date(Number(update_time) * 1000).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <ToDetailBtn record={record} />
                        <DeleteResourceBtn
                          name={t('streamRoutes.singular')}
                          target={id}
                          api={`${API_STREAM_ROUTES}/${id}`}
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

function StreamRouteComponent() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('sources.streamRoutes')} />
      <StreamRouteList
        routeKey="/_authenticated/stream_routes/"
        ToDetailBtn={({ record }) => (
          <ToDetailPageBtn
            key="detail"
            to="/stream_routes/detail/$id"
            params={{ id: record.value.id }}
          />
        )}
      />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/stream_routes/')({
  component: StreamRouteComponent,
  errorComponent: StreamRoutesErrorComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getStreamRouteListQueryOptions(deps)),
});