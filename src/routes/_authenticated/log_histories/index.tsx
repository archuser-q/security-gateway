import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { Select, Input, Tag, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import PageHeader from '@/components/page/PageHeader'
import { AntdConfigProvider } from '@/config/antdConfigProvider'
import type { ParsedLog } from '@/utils/parseLog'

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

function TimelineBar({ logs }: { logs: LogEntry[] }) {
  const BUCKETS = 24
  const now = Date.now()
  const windowMs = 24 * 60 * 60 * 1000
  const bucketMs = windowMs / BUCKETS

  const counts = useMemo(() => {
    const arr = Array(BUCKETS).fill(0)
    logs.forEach(l => {
      const age = now - new Date(l.timestamp).getTime()
      if (age >= 0 && age < windowMs) {
        const idx = BUCKETS - 1 - Math.floor(age / bucketMs)
        if (idx >= 0 && idx < BUCKETS) arr[idx]++
      }
    })
    return arr
  }, [logs])

  const max = Math.max(...counts, 1)

  const hours = Array.from({ length: BUCKETS + 1 }, (_, i) => {
    const d = new Date(now - windowMs + i * bucketMs)
    return d.getHours().toString().padStart(2, '0') + ':00'
  })

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderRadius: 6,
      padding: '12px 16px 8px',
      marginBottom: 12,
    }}>
      <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>
        Timeline
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48 }}>
        {counts.map((c, i) => (
          <div
            key={i}
            title={`${hours[i]} — ${c} logs`}
            style={{
              flex: 1,
              height: c === 0 ? 2 : `${Math.max(4, (c / max) * 48)}px`,
              background: c === 0 ? '#f0f0f0' : '#1677ff',
              borderRadius: 2,
              transition: 'height 0.3s',
              cursor: 'default',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[0, 6, 12, 18, 24].map(i => (
          <span key={i} style={{ color: '#bfbfbf', fontSize: 10 }}>
            {hours[i * (BUCKETS / 24)]}
          </span>
        ))}
      </div>
    </div>
  )
}

function LevelBadge({ level }: { level?: string }) {
  const l = (level ?? 'info').toLowerCase()
  const map: Record<string, { color: string; bg: string; border: string }> = {
    info:    { color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
    warn:    { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
    warning: { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
    error:   { color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
    debug:   { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
  }
  const s = map[l] ?? map.info
  return (
    <Tag
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: 'monospace',
        fontSize: 11,
        padding: '0 6px',
        margin: 0,
      }}
    >
      {l}
    </Tag>
  )
}

function FilterBar({
  search, setSearch,
  level, setLevel,
  onRefresh,
}: {
  search: string
  setSearch: (v: string) => void
  level: string
  setLevel: (v: string) => void
  onRefresh: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '0 0 12px',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      <Select
        size="small"
        value={level}
        onChange={setLevel}
        style={{ width: 120 }}
        options={[
          { value: '', label: 'All levels' },
          { value: 'info', label: 'info' },
          { value: 'warn', label: 'warn' },
          { value: 'error', label: 'error' },
          { value: 'debug', label: 'debug' },
        ]}
      />
      <Input
        size="small"
        placeholder="search…"
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        style={{ width: 220 }}
      />
      <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} />
    </div>
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
      try { parsed = JSON.parse(entry.raw) } catch { /* ignore */ }

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

  const mono = { fontFamily: 'monospace', fontSize: 12 }

  const columns: ProColumns<LogEntry>[] = [
    {
      title: t('form.admins.loginTimestamp', 'Login at'),
      dataIndex: 'timestamp',
      width: 180,
      render: (_, r) => (
        <span style={{ ...mono, whiteSpace: 'nowrap', color: '#595959' }}>
          {new Date(r.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('form.admins.username', 'Username'),
      dataIndex: 'user',
      width: 150,
      render: (_, r) => (
        <span style={{ ...mono, color: '#262626' }}>{r.user ?? '—'}</span>
      ),
    },
    {
      title: 'Level',
      width: 90,
      render: (_, r) => {
        let parsed: ParsedLog = {}
        try { parsed = JSON.parse(r.raw) } catch { /* ignore */ }
        return <LevelBadge level={parsed.level as string} />
      },
    },
    {
      title: t('sources.log', 'Log'),
      dataIndex: 'raw',
      render: (_, r) => {
        let parsed: ParsedLog = {}
        try { parsed = JSON.parse(r.raw) } catch { /* ignore */ }
        const msg = parsed.message as string | undefined
        return (
          <div>
            {msg && (
              <div style={{ ...mono, color: '#262626', marginBottom: 2 }}>{msg}</div>
            )}
            <span style={{ ...mono, color: '#8c8c8c', wordBreak: 'break-all', fontSize: 11 }}>
              {r.raw}
            </span>
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