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
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getConsumerGroupListQueryOptions, useConsumerGroupList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { PluginBadges } from '@/components/page/PluginBadges';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { PaginationBar } from '@/components/PaginationBar';
import SortableHeader, { type SortDir } from '@/components/SortableHeader';
import { API_CONSUMER_GROUPS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import { pageSearchSchema } from '@/types/schema/pageSearch';

type SortKey = 'update_time' | null;

// Không có cột Name vì ConsumerGroup không có field đó (bản cũ có cột
// Name nhưng luôn rỗng vì đọc nhầm field không tồn tại - đã bỏ). Badge
// plugin dùng chung PluginBadges với Plugin Configs vì ConsumerGroup
// bản chất CHÍNH LÀ PluginConfig (chỉ thiếu field name) - xem
// ConsumerGroup = APISIXPluginConfigs.PluginConfig.omit({name:true})
// trong types/schema/apisix/consumer_groups.ts.
function ConsumerGroupsList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination } = useConsumerGroupList();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  // ConsumerGroup không có field "name" nên server không có gì để lọc
  // theo tên - search ở đây lọc phía client theo ID/desc/tên plugin bên
  // trong (hữu ích thật: vd tìm nhanh "group nào đang dùng limit-count").
  const filteredList = useMemo(() => {
    let list = data.list;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => {
        const id = item.value.id ?? '';
        const desc = item.value.desc ?? '';
        const pluginNames = Object.keys(item.value.plugins ?? {}).join(' ');
        return `${id} ${desc} ${pluginNames}`.toLowerCase().includes(q);
      });
    }

    if (sortKey === 'update_time') {
      list = [...list].sort((a, b) => {
        const av = a.value.update_time || 0;
        const bv = b.value.update_time || 0;
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [data.list, search, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <ToAddPageBtn
          to="/consumer_groups/add"
          label={t('info.add.title', { name: t('consumerGroups.singular') })}
        />

        <div className="relative w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <th className="px-4 py-3 text-left font-normal">{t('form.plugins.label')}</th>
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
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              filteredList.map((record) => {
                const { id, desc, plugins, update_time } = record.value;

                return (
                  <tr
                    key={id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-mono">{id}</td>
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
                        <ToDetailPageBtn to="/consumer_groups/detail/$id" params={{ id }} />
                        <DeleteResourceBtn
                          name={t('consumerGroups.singular')}
                          target={id}
                          api={`${API_CONSUMER_GROUPS}/${id}`}
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
      <PageHeader title={t('sources.consumerGroups')} />
      <ConsumerGroupsList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/consumer_groups/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getConsumerGroupListQueryOptions(deps)),
});
