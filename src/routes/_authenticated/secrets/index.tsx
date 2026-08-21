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
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSecretListQueryOptions, useSecretList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { API_SECRETS } from '@/config/constant';
import { queryClient } from '@/config/queryClient';
import { pageSearchSchema } from '@/types/schema/pageSearch';

const MANAGER_COLORS: Record<string, string> = {
  vault: 'bg-purple-50 text-purple-600',
  aws: 'bg-orange-50 text-orange-600',
  gcp: 'bg-blue-50 text-blue-600',
};

/**
 * Same visual language as the other resources (Tailwind + lucide
 * icons, black text). Secret only exposes `id` + `manager` in the
 * schema/UI on purpose — everything else (token, secret_access_key,
 * private_key, etc.) is sensitive credential material and must never
 * be rendered in a list, so there is no way to add more columns here
 * even for visual consistency. There's also no status/plugins/
 * timestamp fields at all (Secret doesn't merge APISIXCommon.Info),
 * so no status tabs and no Updated-At sort — those genuinely don't
 * exist for this resource.
 */
const SecretList = () => {
  const { data, isLoading, refetch, pagination } = useSecretList();
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    let list = data?.list || [];

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter((record) => {
        const { id, manager } = record.value;
        return [id, manager]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(kw));
      });
    }

    return list;
  }, [data, keyword]);

  return (
    <div className="space-y-4">
      {/* Toolbar — no status pill tabs: Secret has no status field */}
      <div className="flex items-center justify-between gap-4">
        <ToAddPageBtn
          to="/secrets/add"
          label={t('info.add.title', { name: t('secrets.singular') })}
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
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.secrets.manager')}
              </th>
              <th className="px-4 py-3 text-right font-normal text-sm text-gray-700">
                {t('table.actions')}
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              filteredList.map((record) => {
                const { id, manager } = record.value;

                return (
                  <tr
                    key={id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-black">{id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
                          MANAGER_COLORS[manager] ?? 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {manager}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <ToDetailPageBtn
                          to="/secrets/detail/$manager/$id"
                          params={{ manager, id }}
                        />
                        <DeleteResourceBtn
                          name={t('secrets.singular')}
                          target={id}
                          api={`${API_SECRETS}/${manager}/${id}`}
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

function PaginationBar({
  pagination,
}: {
  pagination: NonNullable<ReturnType<typeof useSecretList>['pagination']>;
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
      <PageHeader title={t('sources.secrets')} />
      <SecretList />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/secrets/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getSecretListQueryOptions(deps)),
});