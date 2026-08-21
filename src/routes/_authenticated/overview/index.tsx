import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getResourceStatsReq } from '@/apis/stats'
import { req } from '@/config/req'
import LegendRow from '@/components/chart/config/pieConfig/LegendRow'
import PieChart from '@/components/chart/PieChart'
import type { ResourceStat } from '@/types/chart/stats'

export const Route = createFileRoute('/_authenticated/overview/')({
  component: RouteComponent,
})

const RESOURCE_ORDER = [
  { key: 'routes', labelKey: 'sources.routes' },
  { key: 'services', labelKey: 'sources.services' },
  { key: 'upstreams', labelKey: 'sources.upstreams' },
  { key: 'consumers', labelKey: 'sources.consumers' },
  { key: 'consumer_groups', labelKey: 'sources.consumerGroups' },
  { key: 'plugin_configs', labelKey: 'sources.pluginConfigs' },
  { key: 'global_rules', labelKey: 'sources.globalRules' },
  { key: 'ssls', labelKey: 'sources.ssls' },
  { key: 'admins', labelKey: 'sources.admin' },
] as const

function ResourceStatCard({
  title,
  stat,
  isLoading,
}: {
  title: string
  stat: ResourceStat | null
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const total = stat?.total ?? 0
  const enabledPct = !stat || total === 0 ? 0 : Math.round((stat.enabled / total) * 100)
  const disabledPct = !stat || total === 0 ? 0 : 100 - enabledPct

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-400">
          {t('form.basic.labels.total')}: {isLoading || !stat ? '—' : total}
        </span>
      </div>

      {isLoading || !stat ? (
        <div className="flex animate-pulse items-center gap-6">
          <div className="h-24 w-24 shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-full rounded bg-gray-100" />
            <div className="h-6 w-full rounded bg-gray-100" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <PieChart 
            enabled={stat.enabled} 
            disabled={stat.disabled} 
            enabledLabel={t('form.basic.statusOption.1')}
            disabledLabel={t('form.basic.statusOption.0')}
          />
          <div className="flex-1 space-y-3">
            <LegendRow
              colorClass="bg-emerald-500"
              label={t('form.basic.statusOption.1')}
              value={stat.enabled}
              percent={enabledPct}
              variant='enabled'
            />
            <LegendRow
              colorClass="bg-red-500"
              label={t('form.basic.statusOption.0')}
              value={stat.disabled}
              percent={disabledPct}
              variant='disabled'
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RouteComponent() {
  const { t } = useTranslation()
  const [data, setData] = useState<Record<string, ResourceStat> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    getResourceStatsReq(req)
      .then((res) => setData(res))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }, [])

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {t('dashboard.statsError')}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">{t('form.overview.systemOverView')}</h2>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCE_ORDER.map(({ key, labelKey }) => (
          <ResourceStatCard
            key={key}
            title={t(labelKey)}
            stat={data?.[key] ?? null}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}