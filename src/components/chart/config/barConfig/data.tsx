import { 
    getConsumerListQueryOptions,
    getGlobalRuleListQueryOptions,
    getProtoListQueryOptions,
    getRouteListQueryOptions, 
    getSecretListQueryOptions, 
    getServiceListQueryOptions, 
    getSSLListQueryOptions, 
    getUpstreamListQueryOptions
} from "@/apis/hooks"
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export const useChartData = () => {
    const { t } = useTranslation();
    const { data: serviceData } = useQuery(getServiceListQueryOptions({page: 1, page_size: 10}));
    const { data: routeData } = useQuery(getRouteListQueryOptions({page: 1, page_size: 10}));
    const { data: upstreamData } = useQuery(getUpstreamListQueryOptions({page: 1, page_size: 10}));
    const { data: consumerData } = useQuery(getConsumerListQueryOptions({page: 1, page_size: 10}));
    const { data: sslData } = useQuery(getSSLListQueryOptions({page:1, page_size:10}));
    const { data: globalRuleData } = useQuery(getGlobalRuleListQueryOptions({page:1, page_size:10}));
    const { data: secretData } = useQuery(getSecretListQueryOptions({page:1, page_size: 10}));
    const { data: protoData } = useQuery(getProtoListQueryOptions({page: 1, page_size:10}));
    return[
        { type: t('sources.services'), value: serviceData?.total ?? 0 },
        { type: t('sources.routes'), value: routeData?.total ?? 0 },
        { type: t('sources.upstreams'), value: upstreamData?.total ?? 0 },
        { type: t('sources.consumers'), value: consumerData?.total ?? 0 },
        { type: t('sources.ssls'), value: sslData?.total ?? 0 },
        { type: t('sources.globalRules'), value: globalRuleData?.total ?? 0},
        { type: t('sources.secrets'), value: secretData?.total ?? 0},
        { type: t('sources.protos'), value: protoData?.total ?? 0 }
    ];
};