import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState, useMemo } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import { FilterBar } from '@/components/chart/config/columnConfig/log/table'
import { TimelineBar } from '@/components/chart/config/columnConfig/log/column'

type ClickHouseLog = {
  '@timestamp': string
  status: string
  user: string
  request_id: string
  uri: string
  service_id: string
  route_id: string
  latency: string
  method: string
  log_status: string
  client_ip: string
}

const CLICKHOUSE_URL = import.meta.env.VITE_CLICKHOUSE_API_BASE_URL
const CLICKHOUSE_TABLE = import.meta.env.VITE_CLICKHOUSE_TABLE
const CLICKHOUSE_USER = import.meta.env.VITE_CLICKHOUSE_USER
const CLICKHOUSE_PASS = import.meta.env.VITE_CLICKHOUSE_PASS

const fetchLogs = async () => {
  const query = `SELECT * FROM quickstart_db.${CLICKHOUSE_TABLE} FORMAT JSON`

  const res = await fetch(
    `${CLICKHOUSE_URL}/?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization:
          'Basic ' + btoa(`${CLICKHOUSE_USER}:${CLICKHOUSE_PASS}`),
      },
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch logs')
  }

  const json = await res.json()

  return {
    list: json.data as ClickHouseLog[],
    total: json.rows as number,
  }
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
  const [search, setSearch] = useState('')
  const [level] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['log_histories'],
    queryFn: fetchLogs,
    refetchInterval: 10_000,
  })

  const allLogs = data?.list ?? []

  const filtered = useMemo(() => {
    return allLogs.filter(entry => {
      const entryLevel = (entry.log_status ?? 'info').toLowerCase()
      if (level && entryLevel !== level) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !entry.uri.toLowerCase().includes(q) &&
          !(entry.user ?? '').toLowerCase().includes(q) &&
          !(entry['@timestamp'] ?? '').toLowerCase().includes(q) &&
          !(entry.client_ip ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [allLogs, search, level])

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
      title: t('sources.log', 'Log'),
      dataIndex: 'uri',
      render: (_, r) => (
        <div>
          <div className="font-mono text-xs text-gray-800 mb-0.5">
            <span className="font-semibold">{r.method}</span> {r.uri}
            <span className="ml-2 text-gray-500">status: {r.status}</span>
            <span className="ml-2 text-gray-500">latency: {r.latency}s</span>
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
      <TimelineBar logs={allLogs} />
      <FilterBar
        search={search}
        setSearch={setSearch}
        onRefresh={() => refetch()}
      />
      <ProTable<ClickHouseLog>
        columns={columns}
        dataSource={filtered}
        rowKey="request_id"
        loading={isLoading}
        search={false}
        options={false}
        pagination={{ showSizeChanger: true, pageSize: 20 }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}