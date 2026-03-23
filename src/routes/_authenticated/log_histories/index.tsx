import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { Tag } from 'antd'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'

interface LogEntry {
  id: string
  time: string
  user: string
  method: string
  route_id: string
  status: string
}

const fetchLogs = async () => {
  const res = await fetch('http://localhost:3000/logs')
  if (!res.ok) throw new Error('Failed to fetch logs')
  return res.json() as Promise<{ list: LogEntry[]; total: number }>
}

export const Route = createFileRoute('/_authenticated/log_histories/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('sources.log_histories', 'Log Histories')} />
      <LogList />
    </>
  )
}

function LogList() {
  const { t } = useTranslation()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['log_histories'],
    queryFn: fetchLogs,
    refetchInterval: 10_000,
  })

  const columns = useMemo<ProColumns<LogEntry>[]>(() => [
    {
      dataIndex: 'user',
      title: t('form.consumers.username'),
      key: 'user',
      valueType: 'text',
    },
    {
      dataIndex: 'status',
      title: t('form.basic.status'),
      key: 'status',
      render: (_, record) => (
        <Tag color={record.status === 'Success' ? 'success' : 'error'}>
          {record.status}
        </Tag>
      ),
    },
    {
      dataIndex: 'time',
      title: 'Time',
      key: 'time',
      sorter: (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      renderText: (text: string) => new Date(text).toLocaleString(),
    },
  ], [t])

  return (
    <AntdConfigProvider>
      <ProTable<LogEntry>
        columns={columns}
        dataSource={data?.list ?? []}
        rowKey="id"
        loading={isLoading}
        search={false}
        options={{ reload: () => refetch() }}
        pagination={{ pageSize: 7 }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}