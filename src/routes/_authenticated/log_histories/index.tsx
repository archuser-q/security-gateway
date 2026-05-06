import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { useState, useMemo } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import type { ParsedLog } from '@/utils/parseLog'
import { FilterBar, LevelBadge } from '@/components/chart/config/columnConfig/log/table'
import type { LogEntry } from '@/types/chart/log'
import { TimelineBar } from '@/components/chart/config/columnConfig/log/column'

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
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['log_histories'],
    queryFn: fetchLogs,
    refetchInterval: 10_000,
  })

  const allLogs = data?.list ?? []

  const filtered = useMemo(() => {
    return allLogs.filter(entry => {
      let parsed: ParsedLog = {}
      try { parsed = JSON.parse(entry.raw) } catch { }
      const entryLevel = (parsed.level as string ?? 'info').toLowerCase()
      if (level && entryLevel !== level) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !entry.raw.toLowerCase().includes(q) &&
          !(entry.user ?? '').toLowerCase().includes(q) &&
          !(entry.timestamp ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [allLogs, search, level])

  const columns: ProColumns<LogEntry>[] = [
    {
      title: t('form.admins.loginTimestamp', 'Login at'),
      dataIndex: 'timestamp',
      width: 180,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-500 whitespace-nowrap">
          {new Date(r.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('form.admins.username', 'Username'),
      dataIndex: 'user',
      width: 150,
      render: (_, r) => (
        <span className="font-mono text-xs text-gray-800">{r.user ?? '—'}</span>
      ),
    },
    {
      title: 'Level',
      width: 90,
      render: (_, r) => {
        let parsed: ParsedLog = {}
        try { parsed = JSON.parse(r.raw) } catch {}
        return <LevelBadge level={parsed.level as string} />
      },
    },
    {
      title: t('sources.log', 'Log'),
      dataIndex: 'raw',
      render: (_, r) => {
        let parsed: ParsedLog = {}
        try { parsed = JSON.parse(r.raw) } catch {}
        const msg = parsed.message as string | undefined
        return (
          <div>
            {msg && <div className="font-mono text-xs text-gray-800 mb-0.5">{msg}</div>}
            <span className="font-mono text-[11px] text-gray-400 break-all">{r.raw}</span>
          </div>
        )
      },
    },
  ]

  return (
    <AntdConfigProvider>
      <TimelineBar logs={allLogs} />
      <FilterBar
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        onRefresh={() => refetch()}
      />
      <ProTable<LogEntry>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        pagination={{ showSizeChanger: true, pageSize: 20 }}
        cardProps={{ bodyStyle: { padding: 0 } }}
      />
    </AntdConfigProvider>
  )
}