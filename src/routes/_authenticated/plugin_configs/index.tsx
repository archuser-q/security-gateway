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
import { createFileRoute, useSearch } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getPluginConfigListQueryOptions, usePluginConfigList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { PluginBadges } from '@/components/page/PluginBadges';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { PaginationBar } from '@/components/PaginationBar';
import SortableHeader, { type SortDir } from '@/components/SortableHeader';
import { API_PLUGIN_CONFIGS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import { pageSearchSchema } from '@/types/schema/pageSearch';

type SortKey = 'update_time' | null;

function PluginConfigsList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination, setParams } = usePluginConfigList();

  // hooks.ts không trả `params` nữa (giống Upstreams/Admins) - tự lấy
  // qua useSearch theo route hiện tại.
  const rawParams = useSearch({ from: '/_authenticated/plugin_configs/' });
  const params = pageSearchSchema.parse(rawParams);

  const [searchInput, setSearchInput] = useState(params.name ?? '');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    setSearchInput(params.name ?? '');
  }, [params.name]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (params.name ?? '')) {
        setParams({ name: searchInput || undefined, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  const sortedList = useMemo(() => {
    if (sortKey !== 'update_time') return data.list;
    return [...data.list].sort((a, b) => {
      const av = a.value.update_time || 0;
      const bv = b.value.update_time || 0;
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data.list, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <ToAddPageBtn
          to="/plugin_configs/add"
          label={t('info.add.title', { name: t('pluginConfigs.singular') })}
        />

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
              <th className="px-4 py-3 text-left font-normal">ID</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.basic.name')}</th>
              <th className="px-4 py-3 text-left font-normal">Plugins</th>
              <th className="px-4 py-3 text-left font-normal">{t('form.basic.desc')}</th>
              <SortableHeader
                label={t('form.info.update_time')}
                active={sortKey === 'update_time'}
                dir={sortKey === 'update_time' ? sortDir : undefined}
                onClick={() => toggleSort('update_time')}
              />
              <th className="px-4 py-3 text-right font-normal">{t('table.actions')}</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : sortedList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              sortedList.map((record) => {
                const { id, name, desc, plugins, update_time } = record.value;

                return (
                  <tr
                    key={id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-mono">{id}</td>
                    <td className="px-4 py-3">{name || '-'}</td>
                    <td className="px-4 py-3">
                      <PluginBadges plugins={plugins} />
                    </td>
                    <td className="px-4 py-3">{desc || '-'}</td>
                    <td className="px-4 py-3">
                      {update_time
                        ? dayjs(update_time * 1000).format('YYYY-MM-DD HH:mm:ss')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <ToDetailPageBtn to="/plugin_configs/detail/$id" params={{ id }} />
                        <DeleteResourceBtn
                          name={t('pluginConfigs.singular')}
                          target={id}
                          api={`${API_PLUGIN_CONFIGS}/${id}`}
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

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.pluginConfigs')} />
      <PluginConfigsList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/plugin_configs/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getPluginConfigListQueryOptions(deps)),
});
