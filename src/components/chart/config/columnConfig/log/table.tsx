import { Input, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'

export function FilterBar({
  search, setSearch, onRefresh,
}: {
  search: string
  setSearch: (v: string) => void
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
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