import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'

import { getResourceStatsReq } from '@/apis/stats'
import { req } from '@/config/req'
import LegendRow from '@/components/chart/config/pieConfig/LegendRow'
import PieChart from '@/components/chart/PieChart'
import type { ResourceStat } from '@/types/chart/stats'

export const Route = createFileRoute('/_authenticated/overview/')({
  component: RouteComponent,
})

const SECTIONS = [
  {
    titleKey: 'form.overview.sections.traffic',
    items: [
      { key: 'services', labelKey: 'sources.services', path: '/services' },
      { key: 'routes', labelKey: 'sources.routes', path: '/routes' },
      { key: 'stream_routes', labelKey: 'sources.streamRoutes', path: '/stream_routes' },
      { key: 'upstreams', labelKey: 'sources.upstreams', path: '/upstreams' },
    ],
  },
  {
    titleKey: 'form.overview.sections.security',
    items: [
      { key: 'consumers', labelKey: 'sources.consumers', path: '/consumers' },
      { key: 'consumer_groups', labelKey: 'sources.consumerGroups', path: '/consumer_groups' },
      { key: 'ssls', labelKey: 'sources.ssls', path: '/ssls' },
    ],
  },
  {
    titleKey: 'form.overview.sections.configuration',
    items: [
      { key: 'plugin_configs', labelKey: 'sources.pluginConfigs', path: '/plugin_configs' },
      { key: 'global_rules', labelKey: 'sources.globalRules', path: '/global_rules' },
      { key: 'protos', labelKey: 'sources.protos', path: '/protos' },
      { key: 'secrets', labelKey: 'sources.secrets', path: '/secrets' },
      { key: 'admins', labelKey: 'sources.admin', path: '/admins' },
    ],
  },
] as const

function ResourceStatCard({
  title,
  stat,
  isLoading,
  onDetailClick,
}: {
  title: string
  stat: ResourceStat | null
  isLoading: boolean
  onDetailClick: () => void
}) {
  const { t } = useTranslation()
  const total = stat?.total ?? 0
  const enabledPct = !stat || total === 0 ? 0 : Math.round((stat.enabled / total) * 100)
  const disabledPct = !stat || total === 0 ? 0 : 100 - enabledPct

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          type="button"
          onClick={onDetailClick}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {t('form.basic.labels.detail')}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
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
              variant="enabled"
            />
            <LegendRow
              colorClass="bg-red-500"
              label={t('form.basic.statusOption.0')}
              value={stat.disabled}
              percent={disabledPct}
              variant="disabled"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.titleKey}>
            <h3 className="mb-3 text-xl font-semibold uppercase tracking-wide">
              {t(section.titleKey)}
            </h3>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map(({ key, labelKey, path }) => (
                <ResourceStatCard
                  key={key}
                  title={t(labelKey)}
                  stat={data?.[key] ?? null}
                  isLoading={isLoading}
                  onDetailClick={() => navigate({ to: path })}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}