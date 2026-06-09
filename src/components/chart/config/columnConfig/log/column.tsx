import { Tooltip } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

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

export function TimelineBar({ logs }: { logs: ClickHouseLog[] }) {
  const {t} = useTranslation()
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
    const map: Record<string, { total: number; failure: number }> = {}
    days.forEach(d => {
      map[d.toDateString()] = { total: 0, failure: 0 }
    })
    logs.forEach(l => {
      const date = new Date(l['@timestamp'])
      const key = date.toDateString()
      if (!map[key]) return

      const isError = l.log_status === 'failed'
      map[key].total++
      if (isError) map[key].failure++
    })
    return days.map(d => ({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      fullLabel: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      ...map[d.toDateString()],
    }))
  }, [logs, days])

  const max = Math.max(...buckets.flatMap(b => [b.total + b.failure]), 1)
  const BAR_HEIGHT = 64

  return (
    <div className="bg-white border border-gray-200 rounded-md px-4 pt-3 pb-2 mb-3">
      <div className="text-[12px] text-gray-400 text-center mb-2">{t('logs.timeline')}</div>

      <div className="flex items-end gap-3" style={{ height: BAR_HEIGHT }}>
        {buckets.map((b, i) => {
          const total = b.total + b.failure
          const successH = total === 0 ? 0 : Math.max(4, (b.total / max) * BAR_HEIGHT)
          const failureH = total === 0 ? 0 : Math.max(b.failure > 0 ? 4 : 0, (b.failure / max) * BAR_HEIGHT)
          return (
            <Tooltip
              key={i}
              title={
                <div className="text-xs">
                  <div className="font-bold">{b.fullLabel}</div>
                  <div className="text-green-400">✓ Request: {b.total}</div>
                  <div className="text-red-400">✗ Thất bại: {b.failure}</div>
                </div>
              }
            >
              <div className="flex-1 flex flex-col items-center gap-0.5 cursor-default justify-end" style={{ height: BAR_HEIGHT }}>
                <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: BAR_HEIGHT }}>
                  <div
                    className="flex-1 rounded-t-sm transition-all duration-300"
                    style={{
                      height: successH === 0 ? 2 : successH,
                      background: successH === 0 ? '#f0f0f0' : '#52c41a',
                    }}
                  />
                  <div
                    className="flex-1 rounded-t-sm transition-all duration-300"
                    style={{
                      height: failureH === 0 ? 2 : failureH,
                      background: failureH === 0 ? '#f0f0f0' : '#ff4d4f',
                    }}
                  />
                </div>
              </div>
            </Tooltip>
          )
        })}
      </div>

      <div className="flex gap-3 mt-1.5">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 text-center text-gray-400 text-[10px]">
            {b.label}
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center mt-2">
        <span className="flex items-center gap-1 text-[11px] text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
          {t('logs.totalRequest')}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
          {t('logs.failRequest')}
        </span>
      </div>
    </div>
  )
}