import { getRouteListQueryOptions, getServiceListQueryOptions } from '@/apis/hooks'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
const ROOT_ID = 'system'
const useData = () => {
  const { data: routeData } = useQuery(
    getRouteListQueryOptions({ page: 1, page_size: 100 })
  )
  const { data: serviceData } = useQuery(
    getServiceListQueryOptions({ page: 1, page_size: 100 })
  )
  const serviceMap = useMemo(() => {
    if (!serviceData?.list) return {}
    return serviceData.list.reduce<Record<string, string>>((acc, service) => {
      acc[service.value.id] = service.value.name ?? service.value.id
      return acc
    }, {})
  }, [serviceData])
  return useMemo(() => {
    const nodes: any[] = []
    const edges: any[] = []
    
    nodes.push({
      id: ROOT_ID,
      value: {
        title: 'System',
      },
    })
    routeData?.list?.forEach((route) => {
      const routeId = route.value.id
      const routeName = route.value.name 
      const serviceId = route.value.service_id
      const serviceName = serviceId ? serviceMap[serviceId] : undefined
      
      nodes.push({
        id: routeId,
        value: {
          title: routeName,
        },
      })

      edges.push({
        source: ROOT_ID,
        target: routeId,
      })
      if (serviceId) {
        
        if (!nodes.some((n) => n.id === serviceId)) {
          nodes.push({
            id: serviceId,
            value: {
              title: serviceName ?? serviceId,
            },
          })
        }
        
        edges.push({
          source: routeId,
          target: serviceId,
        })
      }
    })
    return { nodes, edges }
  }, [routeData, serviceMap])
}
export default useData