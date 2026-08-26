import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import type { ClickHouseLog } from '@/types/chart/log'
import { fetchLoginLogs, fetchLoginLogsForTimeline } from '@/apis/log'
import { TimelineBar } from '@/components/chart/config/columnConfig/column'
import { DatePicker, Input, Space, Tag } from 'antd'
import type { Dayjs } from 'dayjs'

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

const { RangePicker } = DatePicker

function LogList() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [dateRange, setDateRange] = useState<[Dayjs|null, Dayjs|null] | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const startDate = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined
  const endDate = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined

  const { data, isLoading } = useQuery({
    queryKey: ['log_histories', page, pageSize, username, startDate, endDate],
    queryFn: () => fetchLoginLogs(page, pageSize, username, startDate, endDate),
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
      </Space>

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
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          showSizeChanger: true,
        }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}