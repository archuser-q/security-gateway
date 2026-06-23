import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import { FilterBar } from '@/components/chart/config/columnConfig/log/table'
import type { ClickHouseLog } from '@/types/chart/log'
import { fetchLoginLogs, fetchLoginLogsForTimeline } from '@/apis/log'
import { TimelineBar } from '@/components/chart/config/columnConfig/log/column'
import { Tag } from 'antd'

export const Route = createFileRoute('/_authenticated/login_histories/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('sources.log_histories', 'Login History')} />
      <LogList />
    </>
  )
}

function LogList() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['log_histories', page, pageSize, search],
    queryFn: () => fetchLoginLogs(page, pageSize, search),
    refetchInterval: 10_000,
  })

  const { data: timelineRaw } = useQuery({
    queryKey: ['log_timeline'],
    queryFn: () => fetchLoginLogsForTimeline(),
    refetchInterval: 10_000,
  })

  const allLogs = data?.list ?? []

  const columns: ProColumns<ClickHouseLog>[] = [
    {
      title: t('form.admins.loginTimestamp', 'Login at'),
      dataIndex: 'ts',
      width: 180,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-500 whitespace-nowrap">
          {new Date(r.ts.replace(' ', 'T') + 'Z').toLocaleString()}
        </span>
      ),
    },
    {
      title: t('form.admins.username', 'Username'),
      dataIndex: 'username',
      width: 150,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-800">{r.username || '—'}</span>
      ),
    },
    {
      title: t('form.admins.status', 'Status'),
      dataIndex: 'status',
      width: 90,
      render: (_, r) => (
        <Tag color={r.success < 400 ? 'success' : 'error'}>{r.success}</Tag>
      ),
    },
    {
      title: t('sources.log', 'Detail'),
      dataIndex: 'reason',
      render: (_, r) => (
        <div>
          <div className="font-mono text-xs text-gray-800 mb-0.5">{r.reason}</div>
          <span className="font-mono text-[11px] text-gray-400 break-all">
            ip: {r.ip}
          </span>
          {r.user_agent && (
            <span className="font-mono text-[11px] text-gray-400 break-all block mt-0.5">
              agent: {r.user_agent}
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <AntdConfigProvider>
      <TimelineBar logs={timelineRaw ?? []} />
      <FilterBar search={search} setSearch={setSearch} onRefresh={() => refetch()} />
      <ProTable<ClickHouseLog>
        columns={columns}
        dataSource={allLogs}
        rowKey={(r) => `${r.username}-${r.ts}-${r.ip}`}
        loading={isLoading}
        search={false}
        options={false}
        pagination={{
          current: page,
          pageSize,
          total: data?.total,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
          showSizeChanger: true,
        }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}