import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import { FilterBar } from '@/components/chart/config/columnConfig/log/table'
import { TimelineBar } from '@/components/chart/config/columnConfig/log/column'
import { Tag } from 'antd'
import { fetchAccessLogs, fetchAccessLogsForTimeline } from '@/apis/log'

export type ResourceAccessLog = {
  username: string
  resource: string
  resource_id: string
  method: string
  status: number
  ip: string
  user_agent: string
  ts: string
}

export const Route = createFileRoute('/_authenticated/log_histories/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('sources.log_histories', 'Access Log')} />
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
    queryKey: ['resource_access_log', page, pageSize, search],
    queryFn: () => fetchAccessLogs(page, pageSize, search),
    refetchInterval: 10_000,
  })

  const { data: timelineRaw } = useQuery({
    queryKey: ['access_log_timeline'],
    queryFn: () => fetchAccessLogsForTimeline(),
    refetchInterval: 10_000,
  })

  const allLogs = data?.list ?? []

  const methodColor: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
  }

  const columns: ProColumns<ResourceAccessLog>[] = [
    {
      title: t('form.admins.loginTimestamp', 'Time'),
      dataIndex: 'ts',
      width: 180,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-500 whitespace-nowrap">
          {new Date(r.ts).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('form.admins.username', 'Username'),
      dataIndex: 'username',
      width: 130,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-800">{r.username || '—'}</span>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 90,
      render: (_, r) => (
        <Tag color={methodColor[r.method] ?? 'default'}>{r.method}</Tag>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      render: (_, r) => (
        <div>
          <span className="font-mono text-xs font-semibold text-gray-800">
            {r.resource}
          </span>
          {r.resource_id && (
            <span className="font-mono text-xs text-gray-400 ml-2">
              #{r.resource_id}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t('sources.status', 'Status'),
      dataIndex: 'status',
      width: 90,
      render: (_, r) => {
        const isOk = r.status < 400
        return (
          <Tag color={isOk ? 'success' : 'error'}>{r.status}</Tag>
        )
      },
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 130,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-500">{r.ip || '—'}</span>
      ),
    },
    {
      title: 'User Agent',
      dataIndex: 'user_agent',
      ellipsis: true,
      render: (_, r) => (
        <span className="font-mono text-[11px] text-gray-400">{r.user_agent || '—'}</span>
      ),
    },
  ]

  return (
    <AntdConfigProvider>
      <TimelineBar logs={timelineRaw ?? []} />
      <FilterBar
        search={search}
        setSearch={setSearch}
        onRefresh={() => refetch()}
      />
      <ProTable<ResourceAccessLog>
        columns={columns}
        dataSource={allLogs}
        rowKey={(r) => `${r.ts}-${r.username}-${r.resource_id}`}
        loading={isLoading}
        search={false}
        options={false}
        pagination={{
          current: page,
          pageSize,
          total: data?.total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          showSizeChanger: true,
        }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}