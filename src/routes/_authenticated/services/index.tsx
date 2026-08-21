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
import {
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Search,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getServiceListQueryOptions, useServiceList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { API_SERVICES } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import { pageSearchSchema } from '@/types/schema/pageSearch';

type SortKey = 'name' | 'status' | 'update_time' | null;
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'enabled' | 'disabled';

/**
 * Same visual language as the Administrators page (Tailwind + lucide
 * icons, pill status tabs, sortable headers). Filtering/sorting/status
 * happen client-side over the current page's data: unlike the admin
 * list (a custom backend that accepts status/sort_field query params),
 * Services goes through the real APISIX Admin API, which rejects
 * unrecognized query params (confirmed earlier — it 400s on unexpected
 * params), so no extra params are sent to it here.
 */
const ServiceList = () => {
  const { data, isLoading, refetch, pagination } = useServiceList();
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('info.status.all', 'All status') },
    { key: 'enabled', label: t('table.enabled') },
    { key: 'disabled', label: t('table.disabled') },
  ];

  const filteredList = useMemo(() => {
    let list = data.list;

    if (statusFilter !== 'all') {
      list = list.filter((record) => {
        const isEnabled = record.value.status !== 0;
        return statusFilter === 'enabled' ? isEnabled : !isEnabled;
      });
    }

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter((record) => {
        const { name, desc, id } = record.value;
        return [name, desc, id]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(kw));
      });
    }

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: string | number;
        let bv: string | number;
        if (sortKey === 'name') {
          av = a.value.name || a.value.id;
          bv = b.value.name || b.value.id;
        } else if (sortKey === 'status') {
          av = a.value.status !== 0 ? 1 : 0;
          bv = b.value.status !== 0 ? 1 : 0;
        } else {
          av = a.value.update_time || 0;
          bv = b.value.update_time || 0;
        }
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [data.list, keyword, statusFilter, sortKey, sortDir]);

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
            to="/services/add"
            label={t('info.add.title', { name: t('services.singular') })}
          />
        </div>

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
              <SortableHeader
                label={t('form.basic.name')}
                active={sortKey === 'name'}
                dir={sortKey === 'name' ? sortDir : undefined}
                onClick={() => toggleSort('name')}
              />
              <th className="px-4 py-3 text-sm font-normal text-gray-700">ID</th>
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.basic.desc')}
              </th>
              <SortableHeader
                label={t('form.basic.status')}
                active={sortKey === 'status'}
                dir={sortKey === 'status' ? sortDir : undefined}
                onClick={() => toggleSort('status')}
              />
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
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              filteredList.map((record) => {
                const { id, name, desc, status, update_time } = record.value;
                const isEnabled = status !== 0;

                return (
                  <tr
                    key={id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-black">{name || id}</td>
                    <td className="px-4 py-3 font-mono text-sm text-black">{id}</td>
                    <td className="px-4 py-3 text-black">{desc || '-'}</td>
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
                    <td className="px-4 py-3 text-black">
                      {update_time
                        ? new Date(Number(update_time) * 1000).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <ToDetailPageBtn to="/services/detail/$id" params={{ id }} />
                        <DeleteResourceBtn
                          name={t('services.singular')}
                          target={id}
                          api={`${API_SERVICES}/${id}`}
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

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir | undefined;
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none px-4 py-3 text-sm font-normal text-gray-700 hover:text-black"
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

function PaginationBar({
  pagination,
}: {
  pagination: NonNullable<ReturnType<typeof useServiceList>['pagination']>;
}) {
  const { t } = useTranslation();

  const current = pagination.current ?? 1;
  const pageSize = pagination.pageSize ?? 10;
  const total = pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between text-base text-gray-500">
      <span>{t('table.total', { total, defaultValue: `Total ${total} items` })}</span>
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
      <PageHeader title={t('sources.services')} />
      <ServiceList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/services/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getServiceListQueryOptions(deps)),
});