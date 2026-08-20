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
import type { TablePaginationConfig } from 'antd';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

import { getUpstreamListQueryOptions, useUpstreamList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { API_UPSTREAMS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import dayjs from 'dayjs';

type SortDir = 'asc' | 'desc' | undefined;
type SortField = 'id' | 'name' | 'scheme' | 'update_time';

function UpstreamsList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination, setParams } = useUpstreamList();

  const rawParams = useSearch({ from: '/_authenticated/upstreams/' });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSort = (field: SortField) => {
    const isSame = params.sort_field === field;
    const nextOrder: SortDir = isSame && params.sort_order === 'asc' ? 'desc' : 'asc';
    setParams({ sort_field: field, sort_order: nextOrder });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <ToAddPageBtn
          to="/upstreams/add"
          label={t('info.add.title', { name: t('upstreams.singular') })}
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
                label="ID"
                active={params.sort_field === 'id'}
                dir={params.sort_field === 'id' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('id')}
              />
              <SortableHeader
                label={t('form.basic.name')}
                active={params.sort_field === 'name'}
                dir={params.sort_field === 'name' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('name')}
              />
              <SortableHeader
                label={t('form.upstreams.scheme')}
                active={params.sort_field === 'scheme'}
                dir={params.sort_field === 'scheme' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('scheme')}
              />
              <SortableHeader
                label={t('form.upstreams.updateTime')}
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
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : !data?.list?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              data.list.map((record) => (
                <tr
                  key={record.value.id}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3 font-mono">{record.value.id}</td>
                  <td className="px-4 py-3">{record.value.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5">
                      {record.value.scheme}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const updateTime = (record.value as unknown as { update_time?: number }).update_time;
                      return updateTime ? dayjs(updateTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '-';
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <DeleteResourceBtn
                        name={t('upstreams.singular')}
                        target={record.value.id}
                        api={`${API_UPSTREAMS}/${record.value.id}`}
                        onSuccess={refetch}
                      />
                      <ToDetailPageBtn 
                        to="/upstreams/detail/$id" 
                        params={{ id: record.value.id }} 
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

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none px-4 py-3 font-normal hover:text-gray-600"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </span>
    </th>
  );
}

function PaginationBar({ pagination }: { pagination: TablePaginationConfig }) {
  const { t } = useTranslation();

  const current = pagination.current ?? 1;
  const pageSize = pagination.pageSize ?? 10;
  const total = pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        {t('table.total', { total, defaultValue: `Total ${total} items` })}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={current <= 1}
          onClick={() => pagination.onChange?.(current - 1, pageSize)}
          className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          {t('table.prev', 'Prev')}
        </button>
        <span className="px-2">
          {current} / {totalPages}
        </span>
        <button
          disabled={current >= totalPages}
          onClick={() => pagination.onChange?.(current + 1, pageSize)}
          className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          {t('table.next', 'Next')}
        </button>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.upstreams')} />
      <UpstreamsList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/upstreams/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => queryClient.ensureQueryData(getUpstreamListQueryOptions(deps)),
});