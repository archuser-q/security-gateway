import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'

interface LogEntry {
  id: string
  timestamp: string
  user?: string
  raw: string
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
  const { data, isLoading } = useQuery({
    queryKey: ['log_histories'],
    queryFn: fetchLogs,
    refetchInterval: 10_000,
  })

  const mono = { fontFamily: 'monospace', fontSize: 12, color: '#000' }

  const columns: ProColumns<LogEntry>[] = [
    {
      title: t('form.admins.loginTimestamp'),
      dataIndex: 'timestamp',
      width: 180,
      render: (_, r) => (
        <span style={{ ...mono, whiteSpace: 'nowrap' }}>
          {new Date(r.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('form.admins.username'),
      dataIndex: 'user',
      width: 150,
      render: (_, r) => (
        <span style={mono}>{r.user ?? '—'}</span>
      ),
    },
    {
      title: t('sources.log'),
      dataIndex: 'raw',
      render: (_, r) => (
        <span style={{ ...mono, wordBreak: 'break-all' }}>
          {r.raw}
        </span>
      ),
    },
  ]

  return (
    <AntdConfigProvider>
      <ProTable<LogEntry>
        columns={columns}
        dataSource={data?.list ?? []}
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}