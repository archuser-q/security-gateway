import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProTable, type ProColumns } from '@ant-design/pro-components'
import { Select, Input, Tag, Button, Tooltip } from 'antd'
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
  const DAYS = 7

  const days = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (DAYS - 1 - i))
      d.setHours(0, 0, 0, 0)
      return d
    })
  }, [])

  const buckets = useMemo(() => {
    const map: Record<string, { success: number; failure: number }> = {}
    days.forEach(d => {
      map[d.toDateString()] = { success: 0, failure: 0 }
    })

    logs.forEach(l => {
      const date = new Date(l.timestamp)
      const key = date.toDateString()
      if (!map[key]) return
      let parsed: ParsedLog = {}
      try { parsed = JSON.parse(l.raw) } catch { /* ignore */ }

      const isSuccess = (parsed as { log_status?: string }).log_status === 'success'
      if (isSuccess) map[key].success++
      else map[key].failure++
    })

    return days.map(d => ({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      fullLabel: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      ...map[d.toDateString()],
    }))
  }, [logs, days])

  const max = Math.max(...buckets.flatMap(b => [b.success + b.failure]), 1)
  const BAR_HEIGHT = 64

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8e8e8',
      borderRadius: 6,
      padding: '12px 16px 10px',
      marginBottom: 12,
    }}>
      <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
        Timeline
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: BAR_HEIGHT, paddingBottom: 0 }}>
        {buckets.map((b, i) => {
          const total = b.success + b.failure
          const successH = total === 0 ? 0 : Math.max(4, (b.success / max) * BAR_HEIGHT)
          const failureH = total === 0 ? 0 : Math.max(b.failure > 0 ? 4 : 0, (b.failure / max) * BAR_HEIGHT)
          return (
            <Tooltip
              key={i}
              title={
                <div style={{ fontSize: 12 }}>
                  <div><b>{b.fullLabel}</b></div>
                  <div style={{ color: '#52c41a' }}>✓ Thành công: {b.success}</div>
                  <div style={{ color: '#ff4d4f' }}>✗ Thất bại: {b.failure}</div>
                </div>
              }
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'default', height: BAR_HEIGHT, justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: BAR_HEIGHT, justifyContent: 'center' }}>                
                  <div style={{
                    flex: 1,
                    height: successH === 0 ? 2 : successH,
                    background: successH === 0 ? '#f0f0f0' : '#52c41a',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <div style={{
                    flex: 1,
                    height: failureH === 0 ? 2 : failureH,
                    background: failureH === 0 ? '#f0f0f0' : '#ff4d4f',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s',
                  }} />
                </div>
              </div>
            </Tooltip>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', color: '#8c8c8c', fontSize: 10 }}>
            {b.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#595959', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#52c41a', borderRadius: 2, display: 'inline-block' }} />
          Thành công
        </span>
        <span style={{ fontSize: 11, color: '#595959', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#ff4d4f', borderRadius: 2, display: 'inline-block' }} />
          Thất bại
        </span>
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
    <Tag style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      fontFamily: 'monospace',
      fontSize: 11,
      padding: '0 6px',
      margin: 0,
    }}>
      {l}
    </Tag>
  )
}

function FilterBar({
  search, setSearch, level, setLevel, onRefresh,
}: {
  search: string
  setSearch: (v: string) => void
  level: string
  setLevel: (v: string) => void
  onRefresh: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 0 12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
      render: (_, r) => <span style={{ ...mono, color: '#262626' }}>{r.user ?? '—'}</span>,
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
            {msg && <div style={{ ...mono, color: '#262626', marginBottom: 2 }}>{msg}</div>}
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