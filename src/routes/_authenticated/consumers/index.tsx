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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import { getConsumerListQueryOptions, useConsumerList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { API_CONSUMERS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import dayjs from 'dayjs';
import { PaginationBar } from '@/components/PaginationBar';
import SortableHeader, { type SortDir } from '@/components/SortableHeader';

function ConsumersList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination, setParams } = useConsumerList();

  const rawParams = useSearch({ from: '/_authenticated/consumers/' });
  const params = pageSearchSchema.parse(rawParams);

  const [searchInput, setSearchInput] = useState(params.search ?? '');

  useEffect(() => {
    setSearchInput(params.search ?? '');
  }, [params.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (params.search ?? '')) {
        setParams({ search: searchInput || undefined, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: 'username' | 'desc' | 'update_time') => {
    const isSame = params.sort_field === field;
    const nextOrder: SortDir = isSame && params.sort_order === 'asc' ? 'desc' : 'asc';
    setParams({ sort_field: field, sort_order: nextOrder });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <ToAddPageBtn
          to="/consumers/add"
          label={t('info.add.title', { name: t('consumers.singular') })}
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
              <SortableHeader
                label={t('form.consumers.username')}
                active={params.sort_field === 'username'}
                dir={params.sort_field === 'username' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('username')}
              />
              <th className="px-4 py-3 text-left font-normal">
                {t('form.basic.desc')}
              </th>
              <SortableHeader
                label={t('form.info.update_time')}
                active={params.sort_field === 'update_time'}
                dir={params.sort_field === 'update_time' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('update_time')}
              />
              <th className="w-[120px] px-4 py-3 text-right font-normal">
                {t('table.actions')}
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : data.list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              data.list.map((record) => (
                <tr
                  key={record.value.username}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3">{record.value.username}</td>
                  <td className="px-4 py-3">{record.value.desc || '-'}</td>
                  <td className="px-4 py-3">
                    {record.value.update_time
                      ? dayjs(record.value.update_time * 1000).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <DeleteResourceBtn
                        name={t('consumers.singular')}
                        target={record.value.username}
                        api={`${API_CONSUMERS}/${record.value.username}`}
                        onSuccess={refetch}
                      />
                      <ToDetailPageBtn
                        to="/consumers/detail/$username"
                        params={{ username: record.value.username }}
                      />
                    </div>
                  </td>
                </tr>
              ))
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
      <PageHeader title={t('sources.consumers')} />
      <ConsumersList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/consumers/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => queryClient.ensureQueryData(getConsumerListQueryOptions(deps)),
});