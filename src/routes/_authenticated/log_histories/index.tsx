import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import { TimelineBar } from '@/components/chart/config/columnConfig/column'
import { DatePicker, Input, Select, Space, Tag } from 'antd'
import { fetchAccessLogs, fetchAccessLogsForTimeline } from '@/apis/log'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker
const METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
]

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
  const [username, setUsername] = useState('')
  const [dateRange, setDateRange] = useState<[Dayjs|null, Dayjs|null] | null>(null)
  const [method, setMethod] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const startDate = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined
  const endDate = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['resource_access_log', page, pageSize, username, startDate, endDate, method],
    queryFn: () => fetchAccessLogs(page, pageSize, username, startDate, endDate, method),
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

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder={t('sources.searchUsername', 'Search by username')}
          allowClear
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onSearch={(value) => { setUsername(value); setPage(1) }}
          style={{ width: 240 }}
        />
        <RangePicker
          value={dateRange as any}
          onChange={(dates) => {
            setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
            setPage(1)
          }}
          allowClear
        />
        <Select
          placeholder={t('sources.filterMethod', 'Method')}
          allowClear
          options={METHOD_OPTIONS}
          value={method}
          onChange={(value) => { setMethod(value); setPage(1) }}
          style={{ width: 140 }}
        />
      </Space>

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