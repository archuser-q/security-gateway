import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import { FilterBar } from '@/components/chart/config/columnConfig/log/table'
import { Tag } from 'antd'
import type { ClickHouseLog } from '@/types/chart/log'
import { fetchLoginLogs, fetchLoginLogsForTimeline } from '@/apis/log'
import { TimelineBar } from '@/components/chart/config/columnConfig/log/column'

export const Route = createFileRoute('/_authenticated/login_histories/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('sources.log_histories', 'Log')} />
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
      dataIndex: '@timestamp',
      width: 180,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-500 whitespace-nowrap">
          {new Date(r['@timestamp']).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('form.admins.username', 'Username'),
      dataIndex: 'user',
      width: 150,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-800">{r.user || '—'}</span>
      ),
    },
    {
      title: t('sources.status', 'Trạng thái'),
      dataIndex: 'log_status',
      width: 120,
      render: (_, r) => {
        const isSuccess = r.log_status === 'success'
        return (
          <Tag color={isSuccess ? 'success' : 'error'}>
            {isSuccess ? 'Thành công' : 'Thất bại'}
          </Tag>
        )
      },
    },
    {
      title: t('sources.log', 'Log'),
      dataIndex: 'uri',
      render: (_, r) => (
        <div>
          <div className="font-mono text-xs text-gray-800 mb-0.5">
            <span className="font-semibold">{r.method}</span> {r.uri}
            <span className="ml-2 text-gray-500">status: {r.status}</span>
          </div>
          <span className="font-mono text-[11px] text-gray-400 break-all">
            ip: {r.client_ip} | route: {r.route_id} | req: {r.request_id}
          </span>
        </div>
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
      <ProTable<ClickHouseLog>
        columns={columns}
        dataSource={allLogs}
        rowKey="request_id"
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