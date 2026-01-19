import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as hooks from "@/apis/hooks";

export const useChartData = () => {
  const { t } = useTranslation();

  const queries = [
    { key: 'services', queryFn: hooks.getServiceListQueryOptions, label: t('sources.services') },
    { key: 'routes', queryFn: hooks.getRouteListQueryOptions, label: t('sources.routes') },
    { key: 'upstreams', queryFn: hooks.getUpstreamListQueryOptions, label: t('sources.upstreams') },
    { key: 'consumers', queryFn: hooks.getConsumerListQueryOptions, label: t('sources.consumers') },
    { key: 'consumerGroups', queryFn: hooks.getConsumerGroupListQueryOptions, label: t('sources.consumerGroups') },
    { key: 'ssls', queryFn: hooks.getSSLListQueryOptions, label: t('sources.ssls') },
    { key: 'globalRules', queryFn: hooks.getGlobalRuleListQueryOptions, label: t('sources.globalRules') },
    { key: 'pluginConfigs', queryFn: hooks.getPluginConfigListQueryOptions, label: t('sources.pluginConfigs') },
    { key: 'secrets', queryFn: hooks.getSecretListQueryOptions, label: t('sources.secrets') },
    { key: 'protos', queryFn: hooks.getProtoListQueryOptions, label: t('sources.protos') },
  ];

  const results = useQueries({
    queries: queries.map(({ queryFn }) => ({
      ...queryFn({ page: 1, page_size: 10 }),
    })),
  });

  // Transform results
  return queries.map(({ label }, index) => ({
    type: label,
    value: results[index].data?.total ?? 0,
  }));
};