import { Select, Input, Tag, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
export function LevelBadge({ level }: { level?: string })  {
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
      className="font-mono text-[11px] px-1.5 m-0"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {l}
    </Tag>
  )
}

export function FilterBar({
  search, setSearch, level, setLevel, onRefresh,
}: {
  search: string
  setSearch: (v: string) => void
  level: string
  setLevel: (v: string) => void
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      <Select
        size="small"
        value={level}
        onChange={setLevel}
        className="!w-28"
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
        prefix={<SearchOutlined className="text-gray-300" />}
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        className="!w-56"
      />
      <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} />
    </div>
  )
}