import { getRouteListQueryOptions, getServiceListQueryOptions, getUpstreamListQueryOptions } from "@/apis/hooks"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

const useData = () => {
  const [
    { data: routeData },
    { data: serviceData },
    { data: upstreamData },
  ] = useQueries({
    queries: [
      getRouteListQueryOptions({ page: 1, page_size: 100 }),
      getServiceListQueryOptions({ page: 1, page_size: 100 }),
      getUpstreamListQueryOptions({ page: 1, page_size: 100 }),
    ],
  })

  const serviceMap = useMemo(() => {
    if (!serviceData?.list) return {}

    return serviceData.list.reduce<
      Record<string, { name: string; upstreamId?: string }>
    >((acc, service) => {
      acc[service.value.id] = {
        name: service.value.name ?? service.value.id,
        upstreamId: service.value.upstream_id,
      }
      return acc
    }, {})
  }, [serviceData])

  const upstreamMap = useMemo(() => {
    if (!upstreamData?.list) return {}

    return upstreamData.list.reduce<Record<string, string>>((acc, upstream) => {
      acc[upstream.value.id] = upstream.value.name ?? upstream.value.id
      return acc
    }, {})
  }, [upstreamData])

  return {
    id: 'Request',
    label: 'Request',
    children:
      routeData?.list?.map((route) => {
        const serviceId = route.value.service_id
        const serviceInfo = serviceId ? serviceMap[serviceId] : undefined

        const upstreamId = serviceInfo?.upstreamId
        const upstreamName = upstreamId ? upstreamMap[upstreamId] : undefined

        return {
          id: route.value.id,
          label: route.value.name || route.value.id,
          children: serviceId
            ? [
                {
                  id: `${route.value.id}-service-${serviceId}`,
                  label: serviceInfo?.name,
                  children: upstreamId
                    ? [
                        {
                          id: `${route.value.id}-upstream-${upstreamId}`,
                          label: upstreamName,
                        },
                      ]
                    : [],
                },
              ]
            : [],
        }
      }) ?? [],
  }
}

export default useData