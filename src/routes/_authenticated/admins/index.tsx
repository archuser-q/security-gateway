import { getAdminListQueryOptions, useAdminList } from '@/apis/hooks';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/page/PageHeader';
import { createFileRoute, useSearch } from '@tanstack/react-router'; // 👈 thêm useSearch
import { useTranslation } from 'react-i18next';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { queryClient } from '@/config/queryClient';
import { UpdateAdminStatusBtn } from '@/components/page/UpdateStatusAdminBtn';
import { useAuth } from '@/context/AuthContext';
import { Search, ChevronUp, ChevronDown, CheckCircle2, XCircle, ChevronsUpDown } from 'lucide-react';
import type { TablePaginationConfig } from 'antd';

export const Route = createFileRoute('/_authenticated/admins/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => queryClient.ensureQueryData(getAdminListQueryOptions(deps)),
});

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.admin')} />
      <AdminList />
    </>
  );
}

type SortDir = 'asc' | 'desc' | undefined;

function AdminList() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, pagination, setParams } = useAdminList(); 
  const auth = useAuth();

  const rawParams = useSearch({ from: '/_authenticated/admins/' });
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

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setParams({ status, page: 1 });
  };

  const handleSort = (field: 'username' | 'status' | 'update_time') => {
    const isSame = params.sort_field === field;
    const nextOrder: SortDir = isSame && params.sort_order === 'asc' ? 'desc' : 'asc';
    setParams({ sort_field: field, sort_order: nextOrder });
  };

  const filterOptions: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
    { key: 'all', label: t('info.status.all', 'All status') },
    { key: 'active', label: t('info.status.active') },
    { key: 'inactive', label: t('info.status.inactive') },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleStatusFilter(opt.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                (params.status ?? 'all') === opt.key
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <ToAddPageBtn
            to="/admins/add"
            label={t('info.add.title', { name: t('admins.singular') })}
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
              <SortableHeader
                label={t('form.consumers.username')}
                active={params.sort_field === 'username'}
                dir={params.sort_field === 'username' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('username')}
              />
              <SortableHeader
                label={t('form.basic.status')}
                active={params.sort_field === 'status'}
                dir={params.sort_field === 'status' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('status')}
              />
              <SortableHeader
                label={t('form.info.update_time')}
                active={params.sort_field === 'update_time'}
                dir={params.sort_field === 'update_time' ? (params.sort_order as SortDir) : undefined}
                onClick={() => handleSort('update_time')}
              />
              <th className="px-4 py-3 text-right font-normal">
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
                  key={record.value.id}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3">{record.value.username}</td>

                  <td className="px-4 py-3">
                    {record.value.status ? (
                      <span className="inline-flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-gray-600">{t('info.status.active')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-500">
                        <XCircle className="h-4 w-4" />
                        <span className="text-gray-600">{t('info.status.inactive')}</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {record.value.update_time
                      ? new Date(Number(record.value.update_time) * 1000).toLocaleString()
                      : '-'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ToDetailPageBtn to="/admins/detail/$id" params={{ id: record.value.id }} />
                      {auth.user?.role === 'super_admin' && (
                        <UpdateAdminStatusBtn
                          name={record.value.username}
                          id={record.value.id}
                          status={record.value.status}
                          refetch={refetch}
                        />
                      )}
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