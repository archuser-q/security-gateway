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

export const useChartData = () => {
    const { data: serviceData } = useQuery(getServiceListQueryOptions({page: 1, page_size: 10}));
    const { data: routeData } = useQuery(getRouteListQueryOptions({page: 1, page_size: 10}));
    const { data: upstreamData } = useQuery(getUpstreamListQueryOptions({page: 1, page_size: 10}));
    const { data: consumerData } = useQuery(getConsumerListQueryOptions({page: 1, page_size: 10}));
    const { data: sslData } = useQuery(getSSLListQueryOptions({page:1, page_size:10}));
    const { data: globalRuleData } = useQuery(getGlobalRuleListQueryOptions({page:1, page_size:10}));
    const { data: secretData } = useQuery(getSecretListQueryOptions({page:1, page_size: 10}));
    const { data: protoData } = useQuery(getProtoListQueryOptions({page: 1, page_size:10}));
    return[
        { type: 'Services', value: serviceData?.total ?? 0 },
        { type: 'Routes', value: routeData?.total ?? 0 },
        { type: 'Upstreams', value: upstreamData?.total ?? 0 },
        { type: 'Consumers', value: consumerData?.total ?? 0 },
        { type: 'SSL', value: sslData?.total ?? 0 },
        { type: 'Global Rules', value: globalRuleData?.total ?? 0},
        { type: 'Secrets', value: secretData?.total ?? 0},
        { type: 'Protos', value: protoData?.total ?? 0 }
    ];
};