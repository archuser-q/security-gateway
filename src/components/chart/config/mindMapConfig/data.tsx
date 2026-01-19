import { getRouteListQueryOptions, getServiceListQueryOptions } from "@/apis/hooks"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

const useData = () => {
  const { data: routeData } = useQuery(
    getRouteListQueryOptions({ page: 1, page_size: 100 })
  )
  const { data: serviceData } = useQuery(
    getServiceListQueryOptions({page:1,page_size:100})
  )

  const serviceMap = useMemo(()=>{
    if (!serviceData?.list) return {}
    return serviceData.list.reduce<Record<string, string>>((acc,service)=>{
      acc[service.value.id] = service.value.name ?? service.value.id
      return acc
    },{})
  },[serviceData])

  return {
    id: 'System',
    children:
      routeData?.list?.map((route) => {
        const serviceId = route.value.service_id
        const serviceName = serviceId ? serviceMap[serviceId] : undefined

        return {
          id: route.value.name || route.value.id,
          children: serviceId
            ? [
                {
                  id:`${route.value.name}: ${serviceName}`,
                },
              ]
            : [],
        }
      }) ?? [],
  }
}

export default useData
